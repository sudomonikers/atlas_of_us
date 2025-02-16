# Set variables
API_NAME="aou_api"
GO_SRC_DIR="./src" #relative path to go source
LAMBDA_FUNCTION_NAME="atlas-of-us-lambda"
AWS_REGION="us-east-2" # Replace with your desired AWS region
ZIP_FILE="bootstrap.zip"

# Build the Go application for Linux
echo "Building Go Rest API..."
mkdir -p bin
GOOS="linux" GOARCH="arm64" go build -o bin/bootstrap ${GO_SRC_DIR}/*.go

# Create a zip archive of the binary
echo "Creating zip archive..."
cd bin
zip -r ../${ZIP_FILE} bootstrap
cd ..

# Update the Lambda function code
echo "Updating Lambda function code..."
aws lambda update-function-code \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --zip-file fileb://${ZIP_FILE} \
    --region ${AWS_REGION} | cat

echo "Lambda function updated successfully."

rm -rf bin
rm ${ZIP_FILE}
echo "Resources cleaned up successfully"