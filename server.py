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

        if self.path == '/api/build-manifest':
            try:
                import subprocess
                import sys
                
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                client_id = data.get('clientID')
                
                if not client_id:
                    raise ValueError("Missing clientID")
                
                print(f"Building manifest for {client_id}...")
                subprocess.check_call([sys.executable, 'create-image-manifest.py', client_id])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': f'Manifest created for {client_id}'}).encode('utf-8'))
            except Exception as e:
                print(f"Error building manifest: {e}")
                self.send_error(500, f"Error: {str(e)}")
            return

        if self.path == '/api/build-settings':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                client_id = data.get('clientID')
                
                if not client_id:
                    raise ValueError("Missing clientID")
                
                # Create default settings.json for the client
                settings_path = os.path.join(client_id, 'settings.json')
                default_settings = {
                    "effects": {
                        "effectType": "solid",
                        "hoverOpacity": 0.5,
                        "hoverColor": 1531868
                    }
                }
                
                os.makedirs(client_id, exist_ok=True)
                with open(settings_path, 'w', encoding='utf-8') as f:
                    json.dump(default_settings, f, indent=2)
                
                print(f"Created settings.json for {client_id}")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': f'Settings created for {client_id}'}).encode('utf-8'))
            except Exception as e:
                print(f"Error building settings: {e}")
                self.send_error(500, f"Error: {str(e)}")
            return

        if self.path == '/api/build-light-images':
            try:
                import subprocess
                import sys
                
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                client_id = data.get('clientID')
                
                if not client_id:
                    raise ValueError("Missing clientID")
                
                print(f"Building light images for {client_id}...")
                subprocess.check_call([sys.executable, 'create-light-images.py', client_id])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': f'Light images created for {client_id}'}).encode('utf-8'))
            except Exception as e:
                print(f"Error building light images: {e}")
                self.send_error(500, f"Error: {str(e)}")
            return

        if self.path == '/api/scan-clients':
            try:
                clients = []
                # List all directories starting with CLT
                root_dir = os.getcwd()
                items = os.listdir(root_dir)
                
                for item in items:
                    if os.path.isdir(item) and item.startswith('CLT'):
                        client_data = {
                            'id': item,
                            'path': item,
                            'features': {},
                            'stats': {}
                        }
                        
                        client_path = os.path.join(root_dir, item)
                        
                        # Check 3D-Images
                        img_path = os.path.join(client_path, '3D-Images')
                        if os.path.exists(img_path) and os.path.isdir(img_path):
                            # Count High Res (in root of 3D-Images)
                            full_res = [f for f in os.listdir(img_path) if os.path.isfile(os.path.join(img_path, f)) and f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
                            client_data['stats']['fullResCount'] = len(full_res)
                            
                            # Check Light
                            light_path = os.path.join(img_path, 'light')
                            if os.path.exists(light_path) and os.path.isdir(light_path):
                                light_imgs = [f for f in os.listdir(light_path) if os.path.isfile(os.path.join(light_path, f)) and f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
                                client_data['stats']['lightCount'] = len(light_imgs)
                            else:
                                client_data['stats']['lightCount'] = 0
                                
                            # Check Medium
                            medium_path = os.path.join(img_path, 'medium')
                            if os.path.exists(medium_path) and os.path.isdir(medium_path):
                                medium_imgs = [f for f in os.listdir(medium_path) if os.path.isfile(os.path.join(medium_path, f)) and f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
                                client_data['stats']['mediumCount'] = len(medium_imgs)
                            else:
                                client_data['stats']['mediumCount'] = 0
                        else:
                            client_data['stats']['fullResCount'] = 0
                            client_data['stats']['lightCount'] = 0
                            client_data['stats']['mediumCount'] = 0

                        # Check 3D folder for GLB
                        model_path = os.path.join(client_path, '3D')
                        has_glb = False
                        if os.path.exists(model_path) and os.path.isdir(model_path):
                            glbs = [f for f in os.listdir(model_path) if f.lower().endswith('.glb')]
                            has_glb = len(glbs) > 0
                        client_data['features']['has3DModel'] = has_glb

                        # Check Manifest and Settings
                        client_data['features']['hasManifest'] = os.path.exists(os.path.join(client_path, 'image-manifest.json'))
                        client_data['features']['hasSettings'] = os.path.exists(os.path.join(client_path, 'settings.json'))

                        # Check Optional Folders
                        optionals = ['2D-Plans', '3D-Plans', 'Photos', 'Virtual Visit', 'Location', 'Contact']
                        for opt in optionals:
                            opt_path = os.path.join(client_path, opt)
                            # Check if exists and has content (files)
                            has_content = False
                            if os.path.exists(opt_path) and os.path.isdir(opt_path):
                                if len(os.listdir(opt_path)) > 0:
                                    has_content = True
                            # For files like 'Contact', it might be a file not a folder? User said "folders" but Contact implies info.
                            # Assuming folders as per request "check other folders if they are there"
                            client_data['features'][opt] = has_content

                        # Get preview image (first image from 3D-Images)
                        client_data['previewImage'] = None
                        if os.path.exists(img_path) and os.path.isdir(img_path):
                            # Try light folder first (smaller files)
                            for folder in ['light', 'medium', '']:
                                search_path = os.path.join(img_path, folder) if folder else img_path
                                if os.path.exists(search_path):
                                    imgs = [f for f in os.listdir(search_path) if os.path.isfile(os.path.join(search_path, f)) and f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
                                    if imgs:
                                        # Return relative path from root
                                        client_data['previewImage'] = f"{item}/3D-Images/{folder + '/' if folder else ''}{imgs[0]}"
                                        break

                        clients.append(client_data)

                # Send JSON response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'clients': clients}).encode('utf-8'))
                return

            except Exception as e:
                print(f"Error scanning clients: {e}")
                self.send_error(500, f"Error scanning clients: {str(e)}")
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


