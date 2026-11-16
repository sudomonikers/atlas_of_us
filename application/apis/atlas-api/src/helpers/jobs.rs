//slow work the api hands to atlas-jobs, which Lambda runs asynchronously. Each job carries everything it needs (see
//apis/atlas-jobs/README.md)
use aws_sdk_lambda::{error::DisplayErrorContext, primitives::Blob, types::InvocationType};
use serde::Serialize;
use serde_json::json;

use crate::state::AppState;

pub type BoxError = Box<dyn std::error::Error + Send + Sync>;

//invokes atlas-jobs asynchronously with a job, or logs it to run by hand when there's no function
pub async fn queue(state: &AppState, kind: &str, job: impl Serialize) -> Result<(), BoxError> {
    let body = json!({"kind": kind, "job": job}).to_string();
    let Some((lambda, function)) = &state.jobs else {
        tracing::info!("JOBS_FUNCTION isn't set, so run this job through atlas-jobs by hand: {body}");
        return Ok(());
    };
    lambda.invoke().function_name(function).invocation_type(InvocationType::Event).payload(Blob::new(body)).send().await
        .map_err(|e| DisplayErrorContext(e).to_string())?;
    Ok(())
}
