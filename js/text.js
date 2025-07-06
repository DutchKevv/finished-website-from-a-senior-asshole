/* // text.js
console.log("text.js is geladen");

// Function to apply the navbar color scheme to the hero section
function applyHeroStyles() {
    // Select the elements in the hero section
    const heroHeader = document.querySelector('.hero-section h1');
    const heroParagraph = document.querySelector('.hero-section p');
    const heroButton = document.querySelector('.btn-gold');

    // Brighter gold color for the text and button
    const brightGoldColor = '#FFD700';  // Fel goud
    const brightGoldHoverColor = '#FFFF00'; // Nog feller goud bij hover

    // Apply brighter styles to the hero header
    heroHeader.style.color = brightGoldColor;
    heroHeader.style.textShadow = '6px 6px 30px rgba(0, 0, 0, 1), 0 0 20px rgba(255, 255, 0, 1)' + ' !important';
    heroHeader.style.fontSize = '4rem' + ' !important';
    heroHeader.style.fontWeight = '900' + ' !important';

    // Apply brighter styles to the hero paragraph
    heroParagraph.style.color = brightGoldColor;
    heroParagraph.style.textShadow = '5px 5px 25px rgba(0, 0, 0, 1), 0 0 20px rgba(255, 255, 0, 1)' + ' !important';
    heroParagraph.style.fontSize = '1.5rem' + ' !important';

    // Apply brighter styles to the hero button
    heroButton.style.backgroundColor = brightGoldColor;
    heroButton.style.color = '#000' + ' !important';
    heroButton.style.textShadow = '4px 4px 15px rgba(0, 0, 0, 1), 0 0 20px rgba(255, 255, 0, 1)' + ' !important';
    heroButton.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.9)' + ' !important';
    heroButton.style.fontSize = '1.5rem' + ' !important';
    heroButton.style.padding = '20px 40px' + ' !important';

    // Add hover effect to the button
    heroButton.addEventListener('mouseover', function() {
        heroButton.style.backgroundColor = brightGoldHoverColor;
        heroButton.style.transform = 'scale(1.15)';
    });

    heroButton.addEventListener('mouseout', function() {
        heroButton.style.backgroundColor = brightGoldColor;
        heroButton.style.transform = 'scale(1)';
    });
}

// Run the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', applyHeroStyles);
 */