// script_modern.js
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const hrefAttribute = this.getAttribute('href');

            // Check if it's a valid internal link (not just "#" or a placeholder)
            if (hrefAttribute && hrefAttribute.length > 1 && hrefAttribute.startsWith('#')) {
                const targetElement = document.querySelector(hrefAttribute);

                if (targetElement) {
                    e.preventDefault(); // Prevent default only if target exists

                    // Calculate scroll position (adjust offset as needed)
                    const headerOffset = 60; // Adjust based on potential sticky header height
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
                // If href is like "#placeholder-link", let the default browser behavior handle it (open in new tab if target="_blank")
            }
        });
    });

    // Optional: Add a subtle scroll effect/animation trigger if desired
    // E.g., Add class 'scrolled' to body after scrolling down a bit
    const body = document.body;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            body.classList.add('scrolled');
        } else {
            body.classList.remove('scrolled');
        }
    });

    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab');
    const tables = document.querySelectorAll('.leaderboard-table');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');

            // Hide all tables
            tables.forEach(table => {
                table.style.display = 'none';
            });

            // Show the corresponding table
            const targetTable = document.getElementById(`${tab.dataset.tab}-table`);
            if (targetTable) {
                targetTable.style.display = 'table';
            }
        });
    });
});

function copyCitation() {
  const citation = `@article{yapagci2024bugcraft,
  title={End-to-End Crash Bug Reproduction Using LLM Agents in Minecraft},
  author={Yapağcı, Eray and Öztürk, Yavuz Alp Sencer and Tüzün, Eray},
  journal={arXiv preprint arXiv:2503.20036},
  year={2024}
}`;
  
  navigator.clipboard.writeText(citation).then(() => {
    // Optional: Show a success message
    const button = document.querySelector('.citation-actions button');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}