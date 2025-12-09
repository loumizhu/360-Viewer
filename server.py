#!/usr/bin/env python3
"""
Simple HTTP Server for 360° Image Viewer
Run this script to serve the viewer on a random available port
"""

import http.server
import socketserver
import os
import socket
import random
import webbrowser
import threading
import time
import json

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/api/create-manifest':
            try:
                import subprocess
                import sys
                
                # Run the manifest creation script
                print("Generating manifest via API request...")
                subprocess.check_call([sys.executable, 'create-image-manifest.py'])
                
                # Send JSON response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            except Exception as e:
                print(f"Error generating manifest: {e}")
                self.send_error(500, f"Error generating manifest: {str(e)}")
            return

        if self.path == '/api/save-file':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                filename = data.get('filename')
                content = data.get('content')
                
                if not filename or content is None:
                    raise ValueError("Missing filename or content")
                
                # Basic security: Prevent path traversal
                if '..' in filename or filename.startswith('/') or filename.startswith('\\'):
                     raise ValueError("Invalid filename")
                
                # Write the file
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
                print(f"Saved file via API: {filename}")
                
                # Send JSON response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': f'File {filename} saved successfully'}).encode('utf-8'))
                
            except Exception as e:
                print(f"Error saving file: {e}")
                self.send_error(500, f"Error saving file: {str(e)}")
            return

        super().do_GET() # Fallback to GET for other POSTs if any (though usually not needed)

    def list_directory(self, path):
        """Override to provide JSON directory listing"""
        # Check if JSON listing is requested
        if '?json=1' in self.path:
            try:
                files = []
                for item in os.listdir(path):
                    item_path = os.path.join(path, item)
                    if os.path.isfile(item_path):
                        stat = os.stat(item_path)
                        files.append({
                            'name': item,
                            'size': stat.st_size,
                            'type': 'file'
                        })
                    elif os.path.isdir(item_path):
                        files.append({
                            'name': item,
                            'type': 'directory'
                        })
                
                # Send JSON response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(files).encode('utf-8'))
                return None
            except Exception as e:
                self.send_error(500, f"Error listing directory: {str(e)}")
                return None
        
        # Default directory listing
        return super().list_directory(path)

def find_available_port():
    """Find a random available port in the range 8000-8999"""
    max_attempts = 100
    for _ in range(max_attempts):
        # Try a random port between 8000 and 8999
        port = random.randint(8000, 8999)
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.bind(('', port))
                return port
        except OSError:
            # Port is in use, try another one
            continue
    # Fallback to letting the OS choose a port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(('', 0))
        return sock.getsockname()[1]

def open_browser_delayed(url, delay=2):
    """Open browser after a short delay"""
    def _open():
        time.sleep(delay)
        webbrowser.open(url)
    thread = threading.Thread(target=_open, daemon=True)
    thread.start()

def main():
    # Change to the directory where this script is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Find an available random port
    PORT = find_available_port()
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        url = f"http://localhost:{PORT}"
        url_with_client = f"{url}?clientID=CLT695425"
        
        print("=" * 60)
        print("🚀 360° Image Viewer Server Started!")
        print("=" * 60)
        print(f"\n📍 Server running at: {url}")
        print(f"\n🎯 Demo scene URL: {url_with_client}")
        print(f"\n🌐 Opening browser in 2 seconds...")
        print("   (Or manually open the URL above)\n")
        print("Press Ctrl+C to stop the server\n")
        print("=" * 60)
        
        # Open browser automatically with demo clientID
        open_browser_delayed(url_with_client, delay=2)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped.")

if __name__ == "__main__":
    main()


