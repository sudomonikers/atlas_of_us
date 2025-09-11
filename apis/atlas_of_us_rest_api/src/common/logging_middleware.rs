use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
};
use std::time::Instant;

pub async fn logging_middleware(request: Request, next: Next) -> Response {
    let start = Instant::now();
    let method = request.method().clone();
    let uri = request.uri().clone();
    
    // Log the incoming request
    println!("Incoming Request: {} {}", method, uri);
    
    // Call the handler
    let response = next.run(request).await;
    
    let duration = start.elapsed();
    let status = response.status();
    
    // Log the response
    println!("Request Complete: {} {} - Status: {} - Duration: {:?}", method, uri, status, duration);
    
    response
}