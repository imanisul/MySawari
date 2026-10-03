from PIL import Image

def make_adaptive_icon():
    # Open the logo without background
    logo = Image.open('assets/images/MySawari_nobg.png').convert("RGBA")
    
    # Calculate scale to fit inside 720x720 (the safe zone for 1080x1080 icon)
    # The logo is 470x480. We can scale it up slightly.
    target_size = 600
    ratio = min(target_size / logo.width, target_size / logo.height)
    new_size = (int(logo.width * ratio), int(logo.height * ratio))
    logo = logo.resize(new_size, Image.Resampling.LANCZOS)
    
    # Create 1080x1080 transparent background
    bg = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
    
    # Paste logo in center
    offset = ((1080 - logo.width) // 2, (1080 - logo.height) // 2)
    bg.paste(logo, offset, logo)
    
    # Save as adaptive-icon.png
    bg.save('assets/images/adaptive-icon.png')
    print("Created adaptive-icon.png")

make_adaptive_icon()
