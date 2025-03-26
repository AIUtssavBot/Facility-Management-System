import requests
import json

# Base URL
base_url = "http://localhost:8000"

def test_root():
    """Test the root endpoint"""
    print("\n=== Testing Root Endpoint ===")
    response = requests.get(f"{base_url}/")
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.json()}")

def test_auth_endpoints():
    """Test authentication endpoints"""
    print("\n=== Testing Authentication ===")
    
    # Register a new user (if needed)
    register_data = {
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
    
    try:
        print("Attempting to register a new user...")
        register_response = requests.post(f"{base_url}/api/auth/register", json=register_data)
        print(f"Register status code: {register_response.status_code}")
        
        if register_response.status_code == 200:
            print("Registration successful!")
            print(f"Response: {register_response.json()}")
        else:
            print(f"Registration response: {register_response.text}")
    except Exception as e:
        print(f"Registration error: {str(e)}")
    
    # Login with the user
    login_data = {
        "username": "test@example.com",
        "password": "password123"
    }
    
    try:
        print("\nAttempting to login...")
        login_response = requests.post(
            f"{base_url}/api/auth/login", 
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"Login status code: {login_response.status_code}")
        
        if login_response.status_code == 200:
            print("Login successful!")
            token_data = login_response.json()
            print(f"Token type: {token_data.get('token_type')}")
            access_token = token_data.get("access_token")
            print(f"Token: {access_token[:10]}...")
            return access_token
        else:
            print(f"Login failed: {login_response.text}")
            return None
    except Exception as e:
        print(f"Login error: {str(e)}")
        return None

def test_tasks_endpoints(token=None):
    """Test task endpoints with and without authentication"""
    print("\n=== Testing Tasks Endpoints ===")
    
    # Test GET tasks without auth
    print("\nTesting GET /api/tasks/debug/no-auth (no auth required)...")
    try:
        response = requests.get(f"{base_url}/api/tasks/debug/no-auth")
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            tasks = response.json()
            print(f"Found {len(tasks)} tasks")
            if tasks:
                print(f"Sample task: {json.dumps(tasks[0], indent=2)}")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test GET tasks with auth
    if token:
        print("\nTesting GET /api/tasks (with auth)...")
        try:
            response = requests.get(
                f"{base_url}/api/tasks",
                headers={"Authorization": f"Bearer {token}"}
            )
            print(f"Status code: {response.status_code}")
            if response.status_code == 200:
                tasks = response.json()
                print(f"Found {len(tasks)} tasks")
                if tasks:
                    print(f"Sample task: {json.dumps(tasks[0], indent=2)}")
            else:
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {str(e)}")
    
    # Test the new tasks-fix endpoints
    print("\n=== Testing Tasks-Fix Endpoints ===")
    
    # Test GET tasks-fix/debug without auth
    print("\nTesting GET /api/tasks-fix/debug (no auth required)...")
    try:
        response = requests.get(f"{base_url}/api/tasks-fix/debug")
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            tasks = response.json()
            print(f"Found {len(tasks)} tasks")
            if tasks:
                print(f"Sample task: {json.dumps(tasks[0], indent=2)}")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test GET tasks-fix with auth
    if token:
        print("\nTesting GET /api/tasks-fix (with auth)...")
        try:
            response = requests.get(
                f"{base_url}/api/tasks-fix",
                headers={"Authorization": f"Bearer {token}"}
            )
            print(f"Status code: {response.status_code}")
            if response.status_code == 200:
                tasks = response.json()
                print(f"Found {len(tasks)} tasks")
                if tasks:
                    print(f"Sample task: {json.dumps(tasks[0], indent=2)}")
            else:
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {str(e)}")

def main():
    """Run all tests"""
    test_root()
    token = test_auth_endpoints()
    test_tasks_endpoints(token)

if __name__ == "__main__":
    main() 