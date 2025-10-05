document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add active class to navigation items on scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });
});

// Copy citation to clipboard
function copyCitation(event) {
    const citationText = document.getElementById('citation-text').innerText;
    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;

    // Try modern clipboard API first, with fallback
    const copyToClipboard = (text) => {
        // Modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback method
            return new Promise((resolve, reject) => {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    if (successful) {
                        resolve();
                    } else {
                        reject(new Error('Copy command failed'));
                    }
                } catch (err) {
                    document.body.removeChild(textArea);
                    reject(err);
                }
            });
        }
    };

    copyToClipboard(citationText)
        .then(() => {
            // Show success feedback
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.style.backgroundColor = 'rgba(100, 255, 100, 0.3)';

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.backgroundColor = '';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy citation:', err);
            button.innerHTML = '<i class="fas fa-times"></i> Failed';
            button.style.backgroundColor = 'rgba(255, 100, 100, 0.3)';

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.backgroundColor = '';
            }, 2000);
        });
} 