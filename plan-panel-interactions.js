// Plan Panel Interactions - Tab switching and form handling
(function() {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        // Tab switching
        const tabs = document.querySelectorAll('.plan-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                this.classList.add('active');
                
                const tabType = this.dataset.tab;
                
                // Here you can add logic to show different content based on tab
                // For now, all tabs show the same 2D plan image
                // In the future, you could load different images or content
            });
        });
        
        // Contact form submission
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form data
                const formData = new FormData(this);
                const data = {
                    name: this.querySelector('input[type="text"]').value,
                    email: this.querySelector('input[type="email"]').value,
                    phone: this.querySelector('input[type="tel"]').value,
                    message: this.querySelector('textarea').value
                };
                
                
                // Show success message
                const sendBtn = this.querySelector('.send-btn');
                const originalText = sendBtn.textContent;
                sendBtn.textContent = '✓ Sent!';
                sendBtn.style.background = 'linear-gradient(135deg, #00C851, #007E33)';
                
                // Reset form
                this.reset();
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    sendBtn.textContent = originalText;
                    sendBtn.style.background = '';
                }, 2000);
                
                // Here you would typically send the data to a server
                // Example: fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) })
            });
        }
    });
})();
