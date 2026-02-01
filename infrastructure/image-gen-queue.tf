# =============================================================================
# IMAGE GENERATION JOB QUEUE INFRASTRUCTURE
# SQS queue + Lambda processor for async image generation
# =============================================================================

# -----------------------------------------------------------------------------
# SQS QUEUES
# -----------------------------------------------------------------------------

# Dead letter queue for failed jobs
resource "aws_sqs_queue" "image_gen_dlq" {
  name                      = "image-gen-jobs-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name = "image-gen-jobs-dlq"
  }
}

# Main job queue
resource "aws_sqs_queue" "image_gen_jobs" {
  name                       = "image-gen-jobs"
  visibility_timeout_seconds = 900   # 15 minutes (matches Lambda timeout)
  message_retention_seconds  = 86400 # 1 day
  receive_wait_time_seconds  = 20    # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.image_gen_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "image-gen-jobs"
  }
}

# -----------------------------------------------------------------------------
# LAMBDA IAM ROLE & POLICIES
# -----------------------------------------------------------------------------

resource "aws_iam_role" "image_gen_processor_role" {
  name = "image-gen-processor-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "image_gen_processor_policy" {
  name = "image-gen-processor-policy"
  role = aws_iam_role.image_gen_processor_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = [
          aws_sqs_queue.image_gen_jobs.arn,
          aws_sqs_queue.image_gen_dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:StartInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.general_bucket.arn}/*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# LAMBDA FUNCTION
# -----------------------------------------------------------------------------

data "archive_file" "image_gen_processor_zip" {
  type        = "zip"
  output_path = "zip_files/image_gen_processor.zip"
  source {
    content  = <<EOF
import boto3
import json
import os
import time
import urllib.request
import urllib.error

# Configuration from environment
INSTANCE_ID = os.environ.get('IMAGE_GEN_INSTANCE_ID')
IMAGE_GEN_ENDPOINT = os.environ.get('IMAGE_GEN_ENDPOINT')
S3_BUCKET = os.environ.get('S3_BUCKET')
QUEUE_URL = os.environ.get('QUEUE_URL')
NEO4J_URI = os.environ.get('NEO4J_URI')
NEO4J_USER = os.environ.get('NEO4J_USER')
NEO4J_PASSWORD = os.environ.get('NEO4J_PASSWORD')

ec2 = boto3.client('ec2')
sqs = boto3.client('sqs')
s3 = boto3.client('s3')


def get_instance_state():
    """Get the current state of the GPU EC2 instance."""
    response = ec2.describe_instances(InstanceIds=[INSTANCE_ID])
    return response['Reservations'][0]['Instances'][0]['State']['Name']


def start_instance():
    """Start the GPU EC2 instance."""
    print(f"Starting instance {INSTANCE_ID}")
    ec2.start_instances(InstanceIds=[INSTANCE_ID])


def requeue_message(record, delay_seconds):
    """Re-queue a message with a delay."""
    sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=record['body'],
        DelaySeconds=delay_seconds
    )
    # Delete the original message
    sqs.delete_message(
        QueueUrl=QUEUE_URL,
        ReceiptHandle=record['receiptHandle']
    )


def wait_for_healthcheck(timeout=300):
    """Wait for the image generation API to be healthy."""
    healthcheck_url = IMAGE_GEN_ENDPOINT.replace('/generate', '/healthcheck')
    start_time = time.time()

    while time.time() - start_time < timeout:
        try:
            req = urllib.request.Request(healthcheck_url)
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                if data.get('generation_model_loaded', False):
                    print("Image generation model is ready")
                    return True
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            print(f"Healthcheck not ready: {e}")

        time.sleep(10)

    raise Exception("Healthcheck timeout - model not ready")


def generate_image(prompt):
    """Call the image generation API."""
    request_data = json.dumps({
        'prompt': prompt,
        'width': 1024,
        'height': 1024,
        'num_inference_steps': 8
    }).encode('utf-8')

    req = urllib.request.Request(
        IMAGE_GEN_ENDPOINT,
        data=request_data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=120) as response:
        return response.read()


def upload_to_s3(s3_key, image_bytes):
    """Upload image to S3 and return the URL."""
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=image_bytes,
        ContentType='image/png'
    )

    return f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"


def update_neo4j_node(element_id, avatar_url):
    """Update the Domain node with the avatar URL using Neo4j HTTP API."""
    # Parse neo4j URI to get HTTP endpoint
    # neo4j+s://xxx.databases.neo4j.io -> https://xxx.databases.neo4j.io:7473
    http_uri = NEO4J_URI.replace('neo4j+s://', 'https://').replace('neo4j://', 'http://')
    if ':7687' in http_uri:
        http_uri = http_uri.replace(':7687', ':7474')
    else:
        http_uri = http_uri + ':7474'

    query_url = f"{http_uri}/db/neo4j/tx/commit"

    query_data = json.dumps({
        "statements": [{
            "statement": "MATCH (d:Domain) WHERE elementId(d) = $element_id SET d.avatar_url = $avatar_url RETURN d.name",
            "parameters": {
                "element_id": element_id,
                "avatar_url": avatar_url
            }
        }]
    }).encode('utf-8')

    # Create basic auth header
    import base64
    credentials = base64.b64encode(f"{NEO4J_USER}:{NEO4J_PASSWORD}".encode()).decode()

    req = urllib.request.Request(
        query_url,
        data=query_data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Basic {credentials}'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode())
            if result.get('errors'):
                raise Exception(f"Neo4j error: {result['errors']}")
            print(f"Updated Neo4j node: {result}")
            return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else ''
        raise Exception(f"Neo4j HTTP error {e.code}: {error_body}")


def process_job(job):
    """Process a single image generation job."""
    print(f"Processing job: {job['domain_name']}")

    # Generate image
    print(f"Generating image for prompt: {job['prompt'][:100]}...")
    image_bytes = generate_image(job['prompt'])
    print(f"Generated image: {len(image_bytes)} bytes")

    # Upload to S3
    s3_url = upload_to_s3(job['s3_key'], image_bytes)
    print(f"Uploaded to S3: {s3_url}")

    # Update Neo4j
    update_neo4j_node(job['element_id'], s3_url)
    print(f"Updated Neo4j node {job['element_id']} with avatar_url")

    return s3_url


def handler(event, context):
    """Lambda handler for processing image generation jobs."""
    records = event.get('Records', [])

    if not records:
        print("No records to process")
        return {'statusCode': 200, 'body': 'No records'}

    print(f"Processing {len(records)} records")

    # Check EC2 state
    state = get_instance_state()
    print(f"GPU instance state: {state}")

    if state == 'stopped':
        print("Instance is stopped, starting and requeuing messages")
        start_instance()
        for record in records:
            requeue_message(record, delay_seconds=300)  # 5 minute delay
        return {
            'statusCode': 202,
            'body': f'Instance starting, {len(records)} jobs requeued with 5 min delay'
        }

    if state in ['pending', 'stopping', 'shutting-down']:
        print(f"Instance is {state}, requeuing messages")
        for record in records:
            requeue_message(record, delay_seconds=120)  # 2 minute delay
        return {
            'statusCode': 202,
            'body': f'Instance {state}, {len(records)} jobs requeued with 2 min delay'
        }

    # Instance is running - wait for model to be ready
    try:
        wait_for_healthcheck(timeout=300)
    except Exception as e:
        print(f"Healthcheck failed: {e}")
        # Requeue with delay
        for record in records:
            requeue_message(record, delay_seconds=60)
        return {
            'statusCode': 202,
            'body': f'Model not ready, {len(records)} jobs requeued with 1 min delay'
        }

    # Process all jobs
    results = []
    for record in records:
        try:
            job = json.loads(record['body'])
            s3_url = process_job(job)
            results.append({'domain': job['domain_name'], 'url': s3_url, 'status': 'success'})
        except Exception as e:
            print(f"Error processing job: {e}")
            results.append({'domain': job.get('domain_name', 'unknown'), 'error': str(e), 'status': 'failed'})
            # Don't delete message - let it go to DLQ after retries
            raise

    return {
        'statusCode': 200,
        'body': json.dumps({'processed': len(results), 'results': results})
    }
EOF
    filename = "index.py"
  }
}

resource "aws_lambda_function" "image_gen_processor" {
  filename         = "image_gen_processor.zip"
  function_name    = "image-gen-processor"
  role             = aws_iam_role.image_gen_processor_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.image_gen_processor_zip.output_base64sha256
  runtime          = "python3.12"
  timeout          = 900 # 15 minutes
  memory_size      = 256

  environment {
    variables = {
      IMAGE_GEN_INSTANCE_ID = aws_instance.image_gen_api.id
      IMAGE_GEN_ENDPOINT    = "http://${aws_eip.image_gen_api_eip.public_ip}:8082/generate"
      S3_BUCKET             = aws_s3_bucket.general_bucket.id
      QUEUE_URL             = aws_sqs_queue.image_gen_jobs.url
      NEO4J_URI             = local.NEO4J_URI
      NEO4J_USER            = local.NEO4J_USER
      NEO4J_PASSWORD        = local.NEO4J_PASSWORD
    }
  }

  tags = {
    Name = "Image Gen Processor"
  }
}

# SQS trigger for Lambda
resource "aws_lambda_event_source_mapping" "image_gen_sqs_trigger" {
  event_source_arn                   = aws_sqs_queue.image_gen_jobs.arn
  function_name                      = aws_lambda_function.image_gen_processor.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 30

  # Don't process if Lambda is already running
  scaling_config {
    maximum_concurrency = 2
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "image_gen_processor_logs" {
  name              = "/aws/lambda/image-gen-processor"
  retention_in_days = 14
}

# -----------------------------------------------------------------------------
# OUTPUTS
# -----------------------------------------------------------------------------

output "image_gen_queue_url" {
  value       = aws_sqs_queue.image_gen_jobs.url
  description = "Image generation job queue URL"
}

output "image_gen_queue_arn" {
  value       = aws_sqs_queue.image_gen_jobs.arn
  description = "Image generation job queue ARN"
}

output "image_gen_dlq_url" {
  value       = aws_sqs_queue.image_gen_dlq.url
  description = "Image generation dead letter queue URL"
}
