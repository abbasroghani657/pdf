import os
import shutil
from pypdf import PdfReader, PdfWriter

def compress_pdf(input_path, output_path="/mnt/user-data/outputs/compressed.pdf", level="medium"):
    # Ensure output directory exists (for /mnt/user-data/outputs/...)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Levels configuration mapping
    config = {
        "low":     {"quality": 85, "streams": False, "metadata": True},
        "medium":  {"quality": 65, "streams": True,  "metadata": False},
        "high":    {"quality": 45, "streams": True,  "metadata": True},
        "maximum": {"quality": 25, "streams": True,  "metadata": True, "remove_unreferenced": True}
    }
    
    # Ensure valid level
    level = level.lower()
    if level not in config:
        level = "medium"
        
    original_size = os.path.getsize(input_path)
    
    try:
        _perform_compression(input_path, output_path, config[level])
    except Exception as e:
        print(f"Error at '{level}' compression: {e}")
        # Automatically fallback to "high" if "maximum" fails
        if level == "maximum":
            print("Falling back to 'high' compression level...")
            _perform_compression(input_path, output_path, config["high"])
        else:
            raise e
            
    compressed_size = os.path.getsize(output_path)
    
    # Calculate percentage reduction
    if original_size == 0:
        reduction_pct = 0
    else:
        reduction_pct = max(0, round(((original_size - compressed_size) / original_size) * 100, 1))
        
    return {
        "original_size_bytes": original_size,
        "compressed_size_bytes": compressed_size,
        "reduction_percentage": reduction_pct,
        "output_path": output_path
    }

def _perform_compression(input_path, output_path, settings):
    writer = PdfWriter(clone_from=input_path)
    
    has_images = False
    
    # 1. Image Optimization using Pillow (via pypdf img.replace)
    for page in writer.pages:
        for img in page.images:
            has_images = True
            try:
                # Replace the image with compressed version
                img.replace(img.image, quality=settings["quality"])
            except Exception as img_err:
                # If a specific image fails, we skip it
                pass
                
    if not has_images:
        print("Note: PDF mein koi images nahi hain, sirf text compression hogi.")
        
    # 2. Content Stream Compression
    if settings.get("streams"):
        for page in writer.pages:
            page.compress_content_streams()
            
    # 3. Metadata Optimization
    if settings.get("metadata"):
        writer.add_metadata({}) # Remove all metadata
        
    # 4. Advanced Full Optimization (for Maximum)
    if settings.get("remove_unreferenced"):
        # This can sometimes cause errors on complex PDFs, hence the fallback wrapper
        writer.remove_unreferenced_resources()
        
    # Save the file
    with open(output_path, "wb") as f:
        writer.write(f)

# --- Example Usage ---
if __name__ == "__main__":
    # Test file path for demonstration
    test_input = "test.pdf"
    
    # Create a dummy test file if it doesn't exist
    if not os.path.exists(test_input):
        print(f"Please provide a real PDF named '{test_input}' to test.")
    else:
        # Testing Maximum Level (which falls back to High if it fails)
        result = compress_pdf(test_input, level="maximum")
        print("\n--- Compression Results ---")
        print(f"Original Size: {result['original_size_bytes'] / 1024:.2f} KB")
        print(f"Compressed Size: {result['compressed_size_bytes'] / 1024:.2f} KB")
        print(f"Reduction: {result['reduction_percentage']}%")
        print(f"Saved at: {result['output_path']}")
