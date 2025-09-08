# Build stage
FROM rust:1.89-alpine AS builder

WORKDIR /app

# Install required packages for building
RUN apk add --no-cache musl-dev pkgconfig openssl-dev

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm src/main.rs

# Copy source code
COPY src/ ./src/

# Build the application
RUN cargo build --release

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests and curl for health checks
RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/target/release/atlas_of_us_rest_api .

# Expose port
EXPOSE 8000

# Run the binary
CMD ["./atlas_of_us_rest_api"]