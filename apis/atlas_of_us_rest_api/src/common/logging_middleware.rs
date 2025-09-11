use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
};
use std::time::Instant;
use tracing::{info, info_span, Instrument};

pub async fn logging_middleware(request: Request, next: Next) -> Response {
    let start = Instant::now();
    let method = request.method().clone();
    let uri = request.uri().clone();
    
    // Create a span for this request
    let span = info_span!(
        "http_request",
        method = %method,
        uri = %uri,
    );
    
    async move {
        // Log the incoming request
        info!("Incoming Request: {} {}", method, uri);
        
        // Call the handler
        let response = next.run(request).await;
        
        let duration = start.elapsed();
        let status = response.status();
        
        // Log the response
        info!("Request Complete: {} {} - Status: {} - Duration: {:?}", method, uri, status, duration);
        
        response
    }.instrument(span).await
}