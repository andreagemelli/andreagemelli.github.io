// Simple test to see if JavaScript is working
document.addEventListener('DOMContentLoaded', function() {
    console.log('Test script loaded');
    
    // Add a visible test indicator
    const testDiv = document.createElement('div');
    testDiv.textContent = 'JavaScript is working!';
    testDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: green; color: white; padding: 10px; z-index: 9999; font-size: 16px;';
    document.body.appendChild(testDiv);
    
    // Test if we can find the post title
    const postTitle = document.querySelector('.post-title');
    if (postTitle) {
        console.log('Found post title:', postTitle.textContent);
        postTitle.style.border = '2px solid red';
    } else {
        console.log('No post title found');
    }
});
