// Typewriter effect for the profile title
document.addEventListener('DOMContentLoaded', function() {
    // Find the profile title element
    const profileTitle = document.querySelector('.profile h1');
    
    if (!profileTitle) return;
    
    // Get the original text
    const originalText = profileTitle.textContent.trim();
    
    // Create the typewriter container
    const typewriterContainer = document.createElement('div');
    typewriterContainer.className = 'typewriter-container';
    
    const typewriterText = document.createElement('span');
    typewriterText.className = 'typewriter-text';
    
    // Create a transparent placeholder that maintains the same dimensions
    const placeholderText = document.createElement('span');
    placeholderText.className = 'typewriter-placeholder';
    placeholderText.textContent = originalText;
    placeholderText.style.visibility = 'hidden';
    placeholderText.style.position = 'absolute';
    placeholderText.style.whiteSpace = 'nowrap';
    
    typewriterContainer.appendChild(placeholderText);
    typewriterContainer.appendChild(typewriterText);
    
    // Replace the original h1 content with our typewriter container
    profileTitle.innerHTML = '';
    profileTitle.appendChild(typewriterContainer);
    
    // Typewriter animation function
    function typeWriter(text, element, speed = 100) {
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        // Start typing immediately
        type();
    }
    
    // Start the typewriter effect
    typeWriter(originalText, typewriterText, 80);
});