// Client ID Check - Show message if no clientID is provided
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const clientID = urlParams.get('clientID');
    
    if (!clientID) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'client-check-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
        `;
        
        // Create message box
        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideIn 0.5s ease-out;
        `;
        
        messageBox.innerHTML = `
            <style>
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .demo-btn {
                    animation: pulse 2s infinite;
                }
            </style>
            <div style="font-size: 60px; margin-bottom: 20px;">🏢</div>
            <h2 style="color: #fff; margin-bottom: 15px; font-size: 28px; font-weight: 600;">
                No Client ID Provided
            </h2>
            <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 30px; font-size: 16px; line-height: 1.6;">
                This viewer requires a client ID to display the correct 3D scene and images.
                <br><br>
                Would you like to view the demo scene?
            </p>
            <button class="demo-btn" style="
                background: linear-gradient(135deg, #006FEE, #338EF7);
                color: white;
                border: none;
                padding: 15px 40px;
                font-size: 18px;
                font-weight: 600;
                border-radius: 12px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0, 111, 238, 0.4);
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0, 111, 238, 0.6)';" 
               onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(0, 111, 238, 0.4)';"
               onclick="window.location.href='?clientID=CLT695425'">
                View Demo Scene
            </button>
        `;
        
        overlay.appendChild(messageBox);
        document.body.appendChild(overlay);
    }
})();
