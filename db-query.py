#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database Query Tool for Align Designs Platform
Allows direct SQL execution on PostgreSQL database

Usage:
    python db-query.py "SELECT * FROM aligndesigns.\"User\" LIMIT 5"
    python db-query.py --file query.sql
    python db-query.py --interactive
"""

import sys
import argparse
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
import json
from tabulate import tabulate
import io

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Database configuration from DATABASE.md
# Using postgres user for admin operations
# IMPORTANT: Using schema 'aligndesigns' (not 'public')
DB_CONFIG = {
    'host': '192.168.0.139',
    'port': 5432,
    'database': 'AlignDesignsPlatform',
    'user': 'postgres',
    'password': 'NolosePostgres12345!',
    'options': '-c search_path=aligndesigns,public'
}

def connect_db():
    """Establish database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.Error as e:
        print(f"❌ Connection Error: {e}")
        sys.exit(1)

def execute_query(query, fetch=True):
    """Execute SQL query and return results"""
    conn = connect_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)

            if fetch and cur.description:
                results = cur.fetchall()
                conn.commit()
                return results
            else:
                conn.commit()
                return {"affected_rows": cur.rowcount}
    except psycopg2.Error as e:
        conn.rollback()
        print(f"❌ Query Error: {e}")
        return None
    finally:
        conn.close()

def format_results(results):
    """Format query results for display"""
    if not results:
        return "No results"

    if isinstance(results, dict):
        return json.dumps(results, indent=2)

    if isinstance(results, list) and len(results) > 0:
        # Convert to list of dicts for tabulate
        headers = results[0].keys()
        rows = [list(row.values()) for row in results]
        return tabulate(rows, headers=headers, tablefmt="grid")

    return str(results)

def run_query_from_args(args):
    """Run query based on command line arguments"""
    if args.query:
        # Direct query from command line
        print(f"🔍 Executing query...\n")
        results = execute_query(args.query)
        if results is not None:
            print(format_results(results))
            print(f"\n✅ Query completed")

    elif args.file:
        # Query from file
        try:
            with open(args.file, 'r', encoding='utf-8') as f:
                query = f.read()
            print(f"🔍 Executing query from {args.file}...\n")
            results = execute_query(query)
            if results is not None:
                print(format_results(results))
                print(f"\n✅ Query completed")
        except FileNotFoundError:
            print(f"❌ File not found: {args.file}")

    elif args.interactive:
        # Interactive mode
        interactive_mode()

    else:
        print("❌ No query specified. Use --help for usage information.")

def interactive_mode():
    """Interactive SQL console"""
    print("=" * 60)
    print("🗄️  Align Designs Platform - Interactive SQL Console")
    print("=" * 60)
    print(f"Connected to: {DB_CONFIG['database']}@{DB_CONFIG['host']}")
    print(f"Schema: aligndesigns")
    print("\nCommands:")
    print("  - Type SQL query and press Enter")
    print("  - Type 'exit' or 'quit' to close")
    print("  - Type 'tables' to list all tables")
    print("  - Type 'help' for more commands")
    print("=" * 60 + "\n")

    while True:
        try:
            query = input("SQL> ").strip()

            if not query:
                continue

            if query.lower() in ['exit', 'quit']:
                print("👋 Goodbye!")
                break

            if query.lower() == 'help':
                print_help()
                continue

            if query.lower() == 'tables':
                query = """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'aligndesigns'
                    ORDER BY table_name;
                """

            results = execute_query(query)
            if results is not None:
                print(format_results(results))
                print()

        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

def print_help():
    """Print help message"""
    print("""
Available shortcuts:
  tables          - List all tables in aligndesigns schema
  exit/quit       - Exit interactive mode
  help            - Show this help message

Example queries:
  SELECT * FROM "User" LIMIT 5;
  UPDATE "User" SET email = 'new@email.com' WHERE id = 'uuid';
  SELECT * FROM "Project" WHERE "clientId" = 'uuid';

Note: Table names with capital letters must be quoted: "User", "Project"
""")

def main():
    parser = argparse.ArgumentParser(
        description='Database Query Tool for Align Designs Platform',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Execute a direct query
  python db-query.py "SELECT * FROM aligndesigns.\\"User\\" LIMIT 5"

  # Execute query from file
  python db-query.py --file my-query.sql

  # Interactive mode
  python db-query.py --interactive
  python db-query.py -i
        """
    )

    parser.add_argument('query', nargs='?', help='SQL query to execute')
    parser.add_argument('-f', '--file', help='Execute query from file')
    parser.add_argument('-i', '--interactive', action='store_true',
                       help='Start interactive SQL console')
    parser.add_argument('-j', '--json', action='store_true',
                       help='Output results as JSON')

    args = parser.parse_args()

    # If no arguments, show help
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)

    run_query_from_args(args)

if __name__ == '__main__':
    main()
