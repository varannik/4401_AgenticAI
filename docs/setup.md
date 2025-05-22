# Setup Guide

This guide will walk you through setting up the AI Platform for development and deployment.

## Local Development Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file to add your configuration values.

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit the `.env.local` file to add your configuration values.

4. Run the development server:
   ```bash
   npm run dev
   ```

## Docker Setup

To run the entire application using Docker:

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Azure Deployment

### Prerequisites

1. Install Azure CLI and log in:
   ```bash
   az login
   ```

2. Install Terraform:
   ```bash
   # Follow instructions at https://learn.hashicorp.com/tutorials/terraform/install-cli
   ```

### Deployment Steps

1. Navigate to the terraform directory:
   ```bash
   cd terraform
   ```

2. Initialize Terraform:
   ```bash
   terraform init
   ```

3. Create a deployment plan:
   ```bash
   terraform plan -out=tfplan
   ```

4. Apply the plan:
   ```bash
   terraform apply tfplan
   ```

5. After deployment, get the outputs:
   ```bash
   terraform output
   ```

For detailed infrastructure information, see the `terraform/README.md` file. 