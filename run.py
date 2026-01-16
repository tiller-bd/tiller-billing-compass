"""
Tiller Billing Compass - Interactive API Testing Suite (Menu Driven)
====================================================================
Choose which tests to run from an interactive menu

Requirements:
    pip3 install requests python-dateutil tabulate

Usage:
    python3 run.py
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from tabulate import tabulate

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

TEST_CREDENTIALS = {
    "email": "ceo@tiller.com.bd",
    "password": "adminpassword123"
}


class Colors:
    """ANSI color codes"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


class APITester:
    """Interactive API testing with menu selection"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_data = {
            "category_id": None,
            "client_id": None,
            "department_id": None,
            "project_id": None,
            "bill_id": None
        }
        self.test_results = {"passed": 0, "failed": 0, "skipped": 0}
        self.step_number = 0
        self.terminal_width = os.get_terminal_size().columns if hasattr(os, 'get_terminal_size') else 120
        
    def clear_screen(self):
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def wait_for_enter(self, message="Press ENTER to continue..."):
        print(f"\n{Colors.YELLOW}{'─'*min(80, self.terminal_width)}{Colors.ENDC}")
        input(f"{Colors.CYAN}{Colors.BOLD}⏸  {message}{Colors.ENDC}")
        print()
    
    def print_banner(self):
        self.clear_screen()
        w = min(80, self.terminal_width)
        banner = f"""
{Colors.CYAN}{Colors.BOLD}
{'╔' + '═'*(w-2) + '╗'}
{'║' + '🧪 TILLER BILLING COMPASS - API TEST SUITE'.center(w-2) + '║'}
{'║' + 'Menu Driven Testing Mode'.center(w-2) + '║'}
{'╚' + '═'*(w-2) + '╝'}
{Colors.ENDC}
{Colors.YELLOW}📍 Base URL:{Colors.ENDC} {self.base_url}
{Colors.YELLOW}🕐 Started:{Colors.ENDC} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{Colors.YELLOW}👤 User:{Colors.ENDC} {TEST_CREDENTIALS['email']}
"""
        print(banner)
    
    def print_step_header(self, title: str, description: str = ""):
        self.step_number += 1
        self.clear_screen()
        w = min(80, self.terminal_width)
        
        header = f"""
{Colors.HEADER}{Colors.BOLD}
{'╔' + '═'*(w-2) + '╗'}
{'║  STEP ' + f'{self.step_number:02d}'.ljust(w-9) + '║'}
{'╚' + '═'*(w-2) + '╝'}
{Colors.ENDC}
{Colors.CYAN}{Colors.BOLD}📋 {title}{Colors.ENDC}
"""
        print(header)
        if description:
            print(f"{Colors.YELLOW}ℹ️  {description}{Colors.ENDC}\n")
    
    def format_value(self, value, max_len=50):
        """Format value for table display"""
        if value is None:
            return "null"
        if isinstance(value, bool):
            return str(value).lower()
        if isinstance(value, (int, float)):
            return str(value)
        
        s = str(value)
        if len(s) > max_len:
            return s[:max_len-3] + "..."
        return s
    
    def dict_to_table(self, data: Dict, max_rows=10) -> str:
        """Convert dict to compact table view"""
        if not data:
            return "Empty response"
        
        # Handle list of items
        if isinstance(data, list):
            if len(data) == 0:
                return f"{Colors.YELLOW}(Empty list){Colors.ENDC}"
            
            items_to_show = data[:max_rows]
            remaining = len(data) - max_rows
            
            if isinstance(items_to_show[0], dict):
                headers = list(items_to_show[0].keys())
                rows = []
                for item in items_to_show:
                    row = [self.format_value(item.get(k)) for k in headers]
                    rows.append(row)
                
                table = tabulate(rows, headers=headers, tablefmt="simple", maxcolwidths=30)
                
                if remaining > 0:
                    table += f"\n{Colors.YELLOW}  ... +{remaining} more items{Colors.ENDC}"
                
                return table
            else:
                return "\n".join([f"  • {self.format_value(item)}" for item in items_to_show])
        
        # Handle single object - show ALL fields
        elif isinstance(data, dict):
            items = list(data.items())
            rows = [[k, self.format_value(v, 70)] for k, v in items]
            table = tabulate(rows, headers=["Key", "Value"], tablefmt="simple")
            return table
        
        return str(data)
    
    def print_request(self, method: str, endpoint: str, data: Optional[Dict] = None):
        """Print compact request details"""
        print(f"\n{Colors.CYAN}{Colors.BOLD}→ REQUEST{Colors.ENDC}")
        print(f"  {method} {endpoint}")
        
        if data:
            print(f"\n{Colors.CYAN}Payload:{Colors.ENDC}")
            print(self.dict_to_table(data))
    
    def print_response(self, response: requests.Response, success: bool):
        """Print compact response details"""
        status_color = Colors.GREEN if success else Colors.RED
        status_icon = "✓" if success else "✗"
        
        print(f"\n{status_color}{Colors.BOLD}← RESPONSE {status_icon}{Colors.ENDC}")
        print(f"  Status: {response.status_code} {response.reason}")
        
        try:
            response_data = response.json()
            print(f"\n{status_color}Response:{Colors.ENDC}")
            print(self.dict_to_table(response_data))
        except json.JSONDecodeError:
            text = response.text[:200]
            print(f"  Body: {text}{'...' if len(response.text) > 200 else ''}")
        
        if success:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✅ SUCCESS{Colors.ENDC}")
            self.test_results["passed"] += 1
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}❌ FAILED{Colors.ENDC}")
            self.test_results["failed"] += 1
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                     expected_status: int = 200) -> Optional[Dict]:
        """Make HTTP request with compact logging"""
        url = f"{self.base_url}{endpoint}"
        
        self.print_request(method, endpoint, data)
        
        try:
            if method == "GET":
                response = self.session.get(url)
            elif method == "POST":
                response = self.session.post(url, json=data)
            elif method == "PUT":
                response = self.session.put(url, json=data)
            elif method == "PATCH":
                response = self.session.patch(url, json=data)
            elif method == "DELETE":
                response = self.session.delete(url)
            else:
                print(f"{Colors.RED}Unsupported method: {method}{Colors.ENDC}")
                return None
            
            success = response.status_code == expected_status
            self.print_response(response, success)
            
            if success:
                try:
                    return response.json()
                except json.JSONDecodeError:
                    return {"status": "success", "text": response.text}
            else:
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"\n{Colors.RED}{Colors.BOLD}❌ REQUEST FAILED{Colors.ENDC}")
            print(f"{Colors.RED}Error: {str(e)}{Colors.ENDC}")
            self.test_results["failed"] += 1
            return None
    
    def test_authentication(self) -> bool:
        self.print_step_header("AUTHENTICATION", "Testing login with provided credentials")
        result = self.make_request("POST", "/auth/login", TEST_CREDENTIALS)
        self.wait_for_enter()
        return result is not None
    
    def test_dashboard_metrics(self):
        self.print_step_header("DASHBOARD METRICS", "Fetching dashboard data")
        
        result = self.make_request("GET", "/dashboard/metrics")
        
        if result:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}📊 HIGHLIGHTS:{Colors.ENDC}")
            if "totalBudget" in result:
                print(f"  💰 Total Budget: ${result.get('totalBudget', 0):,.2f}")
            if "totalReceived" in result:
                print(f"  💵 Total Received: ${result.get('totalReceived', 0):,.2f}")
            if "totalRemaining" in result:
                print(f"  📊 Remaining: ${result.get('totalRemaining', 0):,.2f}")
            if "activeCount" in result:
                print(f"  📁 Active Projects: {result.get('activeCount', 0)}")
        
        self.wait_for_enter()
    
    def test_dashboard_suite(self):
        """Run all dashboard tests"""
        self.test_dashboard_metrics()
        
        endpoints = [
            ("/dashboard/revenue", "Revenue Time Series"),
            ("/dashboard/distribution", "Project Distribution"),
            ("/dashboard/deadlines", "Upcoming Deadlines"),
            ("/dashboard/budget-comparison", "Budget Comparison")
        ]
        
        for endpoint, name in endpoints:
            self.print_step_header(f"DASHBOARD - {name.upper()}", f"Fetching {name.lower()}")
            self.make_request("GET", endpoint)
            self.wait_for_enter()
    
    def fetch_existing_data(self):
        """Fetch existing categories, clients, and departments"""
        self.print_step_header("FETCH EXISTING DATA", "Getting categories, clients, and departments")

        categories = self.make_request("GET", "/categories")
        if categories and len(categories) > 0:
            self.test_data["category_id"] = categories[0].get("id")
            print(f"\n{Colors.GREEN}✓ Using category: {categories[0].get('name')} (ID: {self.test_data['category_id']}){Colors.ENDC}")
        else:
            print(f"\n{Colors.RED}✗ No categories found{Colors.ENDC}")
            self.wait_for_enter()
            return False

        clients = self.make_request("GET", "/clients")
        if clients and len(clients) > 0:
            self.test_data["client_id"] = clients[0].get("id")
            print(f"{Colors.GREEN}✓ Using client: {clients[0].get('name')} (ID: {self.test_data['client_id']}){Colors.ENDC}")
        else:
            print(f"\n{Colors.RED}✗ No clients found{Colors.ENDC}")
            self.wait_for_enter()
            return False

        departments = self.make_request("GET", "/departments")
        if departments and len(departments) > 0:
            self.test_data["department_id"] = departments[0].get("id")
            print(f"{Colors.GREEN}✓ Using department: {departments[0].get('name')} (ID: {self.test_data['department_id']}){Colors.ENDC}")
        else:
            print(f"\n{Colors.RED}✗ No departments found{Colors.ENDC}")
            self.wait_for_enter()
            return False

        self.wait_for_enter()
        return True
    
    def test_categories(self):
        """Test category endpoints"""
        self.print_step_header("CATEGORIES", "Fetching all categories")
        self.make_request("GET", "/categories")
        self.wait_for_enter()
    
    def test_clients(self):
        """Test client endpoints"""
        self.print_step_header("CLIENTS", "Fetching all clients")
        self.make_request("GET", "/clients")
        self.wait_for_enter()
    
    def test_projects(self):
        """Test project endpoints"""
        self.print_step_header("PROJECTS - LIST ALL", "Fetching all projects")
        projects = self.make_request("GET", "/projects")
        self.wait_for_enter()
        
        # If projects exist, fetch one in detail
        if projects and len(projects) > 0:
            project_id = projects[0].get("id")
            self.print_step_header("PROJECTS - SINGLE PROJECT", f"Fetching project {project_id}")
            result = self.make_request("GET", f"/projects/{project_id}")
            
            if result:
                print(f"\n{Colors.YELLOW}{Colors.BOLD}📊 PROJECT FINANCIALS:{Colors.ENDC}")
                if "totalProjectValue" in result:
                    budget = float(result.get('totalProjectValue') or 0)
                    print(f"  💰 Budget: ${budget:,.2f}")
                if "bills" in result:
                    total_invoiced = sum(float(bill.get('billAmount') or 0) for bill in result.get('bills', []))
                    print(f"  📄 Total Invoiced: ${total_invoiced:,.2f}")
                    print(f"  📋 Bills Count: {len(result.get('bills', []))}")
            
            self.wait_for_enter()
    
    def test_bills(self):
        """Test bill endpoints"""
        self.print_step_header("BILLS - LIST ALL", "Fetching all bills")
        bills = self.make_request("GET", "/bills")

        if bills and len(bills) > 0:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}📊 BILLING SUMMARY:{Colors.ENDC}")
            total = sum(float(bill.get('billAmount') or 0) for bill in bills)
            pending = sum(float(bill.get('billAmount') or 0) for bill in bills if bill.get('status') == 'PENDING')
            paid = sum(float(bill.get('billAmount') or 0) for bill in bills if bill.get('status') == 'PAID')

            print(f"  💰 Total: ${total:,.2f}")
            print(f"  ⏳ Pending: ${pending:,.2f}")
            print(f"  ✅ Paid: ${paid:,.2f}")

        self.wait_for_enter()
    
    def test_create_project_debug(self):
        """Debug project creation with raw request inspection"""
        if not self.fetch_existing_data():
            return

        self.print_step_header("DEBUG - CREATE PROJECT", "Testing project creation with debugging")

        start_date = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000Z")
        end_date = (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

        project_data = {
            "projectName": f"Test Project {datetime.now().strftime('%H%M%S')}",
            "totalProjectValue": 50000.00,
            "startDate": start_date,
            "endDate": end_date,
            "clientId": self.test_data["client_id"],
            "categoryId": self.test_data["category_id"],
            "departmentId": self.test_data["department_id"]
        }
        
        print(f"\n{Colors.CYAN}{Colors.BOLD}Raw JSON Payload:{Colors.ENDC}")
        print(json.dumps(project_data, indent=2))
        
        print(f"\n{Colors.YELLOW}Attempting POST to /projects...{Colors.ENDC}")
        
        # Try with raw requests to see actual response
        url = f"{self.base_url}/projects"
        try:
            response = self.session.post(url, json=project_data)
            print(f"\n{Colors.CYAN}Status Code: {response.status_code}{Colors.ENDC}")
            print(f"{Colors.CYAN}Response Headers:{Colors.ENDC}")
            for k, v in response.headers.items():
                print(f"  {k}: {v}")
            
            print(f"\n{Colors.CYAN}Raw Response Body:{Colors.ENDC}")
            print(response.text)
            
            if response.status_code == 201:
                result = response.json()
                self.test_data["project_id"] = result.get("id")
                print(f"\n{Colors.GREEN}✅ Project created: {self.test_data['project_id']}{Colors.ENDC}")
                self.test_results["passed"] += 1
            else:
                print(f"\n{Colors.RED}❌ Failed to create project{Colors.ENDC}")
                self.test_results["failed"] += 1
                
        except Exception as e:
            print(f"{Colors.RED}Error: {str(e)}{Colors.ENDC}")
            self.test_results["failed"] += 1
        
        self.wait_for_enter()
    
    def test_full_workflow(self):
        """Run complete bill workflow"""
        if not self.fetch_existing_data():
            return
        
        # For workflow, we'll use existing projects
        self.print_step_header("WORKFLOW - SELECT PROJECT", "Fetching existing projects")
        projects = self.make_request("GET", "/projects")
        
        if not projects or len(projects) == 0:
            print(f"\n{Colors.RED}No projects available. Create a project first.{Colors.ENDC}")
            self.wait_for_enter()
            return
        
        self.test_data["project_id"] = projects[0].get("id")
        print(f"\n{Colors.GREEN}Using project: {projects[0].get('projectName')} (ID: {self.test_data['project_id']}){Colors.ENDC}")
        self.wait_for_enter()
        
        # Create bill
        self.print_step_header("WORKFLOW - CREATE BILL", "Creating invoice for project")

        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

        bill_data = {
            "billName": f"INV-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "billAmount": 25000.00,
            "status": "PENDING",
            "tentativeBillingDate": due_date,
            "projectId": self.test_data["project_id"]
        }

        result = self.make_request("POST", "/bills", bill_data, 201)
        
        if result and "id" in result:
            self.test_data["bill_id"] = result["id"]
            print(f"\n{Colors.GREEN}💾 Bill created: {result['id']}{Colors.ENDC}")
        else:
            self.wait_for_enter()
            return
        
        self.wait_for_enter()
        
        # Mark as paid
        self.print_step_header("WORKFLOW - MARK AS PAID", "Recording payment")
        result = self.make_request("PATCH", f"/bills/{self.test_data['bill_id']}",
                                  {"status": "PAID"})
        
        if result:
            print(f"\n{Colors.GREEN}✅ Payment recorded! Revenue updated by $25,000.00{Colors.ENDC}")
        
        self.wait_for_enter()
        
        # Verify dashboard
        self.print_step_header("WORKFLOW - VERIFY DASHBOARD", "Checking revenue update")
        self.make_request("GET", "/dashboard/metrics")
        self.wait_for_enter()
        
        # Cleanup
        if self.test_data["bill_id"]:
            self.print_step_header("WORKFLOW - CLEANUP", "Removing test bill")
            self.make_request("DELETE", f"/bills/{self.test_data['bill_id']}")
            print(f"\n{Colors.GREEN}✨ Cleanup complete{Colors.ENDC}")
            self.wait_for_enter()
    
    def test_logout(self):
        self.print_step_header("LOGOUT", "Terminating session")
        self.make_request("POST", "/auth/logout")
        self.wait_for_enter()
    
    def show_menu(self):
        """Display interactive menu"""
        self.clear_screen()
        self.print_banner()
        
        menu = f"""
{Colors.HEADER}{Colors.BOLD}╔════════════════════════════════════════════════════════════════════════════╗
║                           SELECT TEST SUITE                                ║
╚════════════════════════════════════════════════════════════════════════════╝{Colors.ENDC}

{Colors.CYAN}📊 Dashboard Tests{Colors.ENDC}
  {Colors.BOLD}1.{Colors.ENDC} Dashboard Metrics & Charts

{Colors.CYAN}📁 Data Endpoints{Colors.ENDC}
  {Colors.BOLD}2.{Colors.ENDC} Categories
  {Colors.BOLD}3.{Colors.ENDC} Clients
  {Colors.BOLD}4.{Colors.ENDC} Projects
  {Colors.BOLD}5.{Colors.ENDC} Bills

{Colors.CYAN}🔧 Debugging{Colors.ENDC}
  {Colors.BOLD}6.{Colors.ENDC} Debug Project Creation (Raw Request Inspection)

{Colors.CYAN}🔄 Workflows{Colors.ENDC}
  {Colors.BOLD}7.{Colors.ENDC} Full Billing Workflow (Create Bill → Pay → Verify)

{Colors.CYAN}🚪 Session{Colors.ENDC}
  {Colors.BOLD}8.{Colors.ENDC} Logout
  {Colors.BOLD}0.{Colors.ENDC} Exit

{Colors.YELLOW}Current Results: {Colors.GREEN}✓ {self.test_results['passed']}{Colors.ENDC} | {Colors.RED}✗ {self.test_results['failed']}{Colors.ENDC} | {Colors.YELLOW}⊘ {self.test_results['skipped']}{Colors.ENDC}
"""
        print(menu)
        
        choice = input(f"{Colors.CYAN}{Colors.BOLD}Select option (0-8): {Colors.ENDC}").strip()
        return choice
    
    def run_interactive(self):
        """Run in interactive menu mode"""
        try:
            # Login once at start
            if not self.test_authentication():
                print(f"\n{Colors.RED}Authentication failed. Exiting.{Colors.ENDC}")
                return
            
            while True:
                choice = self.show_menu()
                
                if choice == "0":
                    print(f"\n{Colors.YELLOW}Exiting...{Colors.ENDC}")
                    break
                elif choice == "1":
                    self.test_dashboard_suite()
                elif choice == "2":
                    self.test_categories()
                elif choice == "3":
                    self.test_clients()
                elif choice == "4":
                    self.test_projects()
                elif choice == "5":
                    self.test_bills()
                elif choice == "6":
                    self.test_create_project_debug()
                elif choice == "7":
                    self.test_full_workflow()
                elif choice == "8":
                    self.test_logout()
                    break
                else:
                    print(f"{Colors.RED}Invalid choice. Try again.{Colors.ENDC}")
                    self.wait_for_enter()
                    
        except KeyboardInterrupt:
            print(f"\n\n{Colors.YELLOW}⚠️  Interrupted by user{Colors.ENDC}")
        except Exception as e:
            print(f"\n{Colors.RED}Unexpected error: {str(e)}{Colors.ENDC}")
        finally:
            self.print_summary()
    
    def print_summary(self):
        self.clear_screen()
        
        total = sum(self.test_results.values())
        success_rate = (self.test_results["passed"] / total * 100) if total > 0 else 0
        
        w = min(80, self.terminal_width)
        summary = f"""
{Colors.HEADER}{Colors.BOLD}
{'╔' + '═'*(w-2) + '╗'}
{'║' + 'TEST EXECUTION SUMMARY'.center(w-2) + '║'}
{'╚' + '═'*(w-2) + '╝'}
{Colors.ENDC}

{Colors.GREEN}{Colors.BOLD}✓ Passed:{Colors.ENDC}  {self.test_results['passed']}
{Colors.RED}{Colors.BOLD}✗ Failed:{Colors.ENDC}  {self.test_results['failed']}
{Colors.YELLOW}{Colors.BOLD}⊘ Skipped:{Colors.ENDC} {self.test_results['skipped']}
{Colors.BOLD}━ Total:{Colors.ENDC}   {total}
{Colors.BOLD}Success:{Colors.ENDC}   {success_rate:.1f}%
"""
        print(summary)
        
        if self.test_results["failed"] == 0 and total > 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}{'='*w}{Colors.ENDC}")
            print(f"{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! 🎉{Colors.ENDC}".center(w+10))
            print(f"{Colors.GREEN}{Colors.BOLD}{'='*w}{Colors.ENDC}")
        elif self.test_results["failed"] > 0:
            print(f"\n{Colors.RED}{Colors.BOLD}{'='*w}{Colors.ENDC}")
            print(f"{Colors.RED}{Colors.BOLD}⚠️  SOME TESTS FAILED{Colors.ENDC}".center(w+10))
            print(f"{Colors.RED}{Colors.BOLD}{'='*w}{Colors.ENDC}")
        
        print(f"\n{Colors.CYAN}Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.ENDC}\n")


def main():
    tester = APITester(API_BASE)
    tester.run_interactive()


if __name__ == "__main__":
    main()