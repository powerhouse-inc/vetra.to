# Service Logos

This directory contains custom SVG logos for cloud environment services.

## Current Services

- **connect.svg** - CONNECT service logo
- **switchboard.svg** - SWITCHBOARD service logo  
- **fusion.svg** - FUSION service logo

## Usage

The `ServiceLogo` component automatically loads these SVGs and falls back to Lucide icons if the files don't exist.

## Customization

To replace with your own logos:

1. **Replace the SVG files** with your custom designs
2. **Keep the same filenames** (`connect.svg`, `switchboard.svg`, `fusion.svg`)
3. **Use SVG format** for best scaling and performance
4. **Include `currentColor`** in your SVG fills/strokes to inherit theme colors

## Example SVG Structure

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Your logo content here -->
  <!-- Use fill="currentColor" or stroke="currentColor" to inherit theme colors -->
</svg>
```

## Integration

The logos are automatically used in:
- Service cards in cloud environment details
- Service listings and management screens
- Any component using the `ServiceLogo` component