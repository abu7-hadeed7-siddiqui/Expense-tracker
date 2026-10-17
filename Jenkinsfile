pipeline {
    agent any

    environment {
        APP_NAME = 'expense-tracker'
        IMAGE_NAME = 'expense-tracker'
        // Jenkins Credentials ID for Docker Registry (configure in Jenkins: Manage Jenkins -> Credentials)
        DOCKER_CREDS_ID = 'dockerhub-credentials'
    }

    parameters {
        string(name: 'DOCKER_USER', defaultValue: 'collegedemo', description: 'Docker Hub username / registry namespace')
        booleanParam(name: 'PUSH_IMAGE', defaultValue: false, description: 'Push image to Docker Hub (requires dockerhub-credentials)')
        booleanParam(name: 'DEPLOY_K8S', defaultValue: false, description: 'Deploy to Kubernetes cluster (requires kubectl access)')
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo "Checking out source code from Git repository..."
                checkout scm
            }
        }

        stage('2. Install Dependencies & Automated Tests') {
            steps {
                echo "Creating virtual environment and executing automated test suite..."
                sh '''
                    python3 -m venv venv || virtualenv venv
                    . venv/bin/activate
                    pip install --upgrade pip
                    pip install -r requirements.txt
                    echo "Running pytest test suite..."
                    pytest tests/test_app.py -v
                '''
            }
        }

        stage('3. Build Docker Image') {
            steps {
                echo "Building production Docker container image..."
                sh """
                    docker build -t ${APP_NAME}:${BUILD_NUMBER} -t ${APP_NAME}:latest .
                    echo "Docker image built successfully: ${APP_NAME}:${BUILD_NUMBER}"
                """
            }
        }

        stage('4. Push to Container Registry') {
            when {
                expression { return params.PUSH_IMAGE == true }
            }
            steps {
                echo "Authenticating with Docker Hub and publishing image..."
                withCredentials([usernamePassword(credentialsId: "${env.DOCKER_CREDS_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                        docker tag ${APP_NAME}:latest \$DOCKER_USER/${APP_NAME}:${BUILD_NUMBER}
                        docker tag ${APP_NAME}:latest \$DOCKER_USER/${APP_NAME}:latest
                        docker push \$DOCKER_USER/${APP_NAME}:${BUILD_NUMBER}
                        docker push \$DOCKER_USER/${APP_NAME}:latest
                        docker logout
                        echo "Image successfully pushed to Docker Hub: \$DOCKER_USER/${APP_NAME}:latest"
                    """
                }
            }
        }

        stage('5. Deploy to Kubernetes') {
            when {
                expression { return params.DEPLOY_K8S == true }
            }
            steps {
                echo "Applying Kubernetes manifests to target cluster..."
                sh """
                    # Apply storage and configuration first
                    kubectl apply -f k8s/persistent-volume.yaml
                    kubectl apply -f k8s/persistent-volume-claim.yaml
                    kubectl apply -f k8s/service.yaml
                    kubectl apply -f k8s/deployment.yaml
                    
                    # Update image to current build if pushed
                    if [ "${params.PUSH_IMAGE}" = "true" ] && [ -n "${params.DOCKER_USER}" ]; then
                        kubectl set image deployment/expense-tracker-deployment expense-tracker=${params.DOCKER_USER}/${APP_NAME}:${BUILD_NUMBER}
                    fi
                """
            }
        }

        stage('6. Verify Rollout & Health') {
            when {
                expression { return params.DEPLOY_K8S == true }
            }
            steps {
                echo "Verifying Kubernetes deployment rollout status..."
                sh '''
                    kubectl rollout status deployment/expense-tracker-deployment --timeout=120s
                    echo "Checking pod status:"
                    kubectl get pods -l app=expense-tracker
                    kubectl get svc expense-tracker-service
                '''
            }
        }
    }

    post {
        always {
            echo "Pipeline execution finished."
            cleanWs deleteDirs: true, notFailBuild: true
        }
        success {
            echo "CI/CD Pipeline Completed Successfully! Application tested, built, and ready."
        }
        failure {
            echo "Pipeline Failed! Please review stage failure logs above."
        }
    }
}
