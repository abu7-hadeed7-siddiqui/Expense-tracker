pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    parameters {
        booleanParam(name: 'PUSH_IMAGE', defaultValue: false, description: 'Push image to a registry (keep false)')
        booleanParam(name: 'DEPLOY_K8S', defaultValue: false, description: 'Deploy to Kubernetes (keep false)')
    }

    environment {
        IMAGE_NAME = 'expense-tracker'
        IMAGE_TAG  = "jenkins-${env.BUILD_NUMBER}"
    }

    stages {
        stage('Get Source') {
            steps {
                sh '''
                    set -e
                    test -f /project/app.py
                    rm -rf ./* ./.venv 2>/dev/null || true
                    cd /project
                    tar --exclude=.git --exclude=.venv --exclude=__pycache__ \
                        --exclude=.pytest_cache --exclude='*.db' -cf - . | (cd "$WORKSPACE" && tar -xf -)
                    cd "$WORKSPACE" && ls -la
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    set -e
                    python3 -m venv .venv
                    . .venv/bin/activate
                    pip install --upgrade pip
                    pip install -r requirements.txt pytest
                '''
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                    . .venv/bin/activate
                    export PYTHONPATH="$WORKSPACE"
                    python -m pytest tests/test_app.py -v
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .'
                sh 'docker images ${IMAGE_NAME}'
            }
        }

        stage('Push Image') {
            when { expression { return params.PUSH_IMAGE } }
            steps {
                echo 'PUSH_IMAGE is disabled for this demo.'
            }
        }

        stage('Deploy to Kubernetes') {
            when { expression { return params.DEPLOY_K8S } }
            steps {
                echo 'DEPLOY_K8S is disabled until separately verified.'
            }
        }
    }

    post {
        success { echo 'Pipeline finished successfully.' }
        failure { echo 'Pipeline failed - check the stage logs above.' }
        always {
            script {
                try {
                    cleanWs()
                } catch (err) {
                    echo "Workspace cleanup skipped: ${err.getMessage()}"
                }
            }
        }
    }
}