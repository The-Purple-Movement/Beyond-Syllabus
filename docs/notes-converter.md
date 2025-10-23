# Notes Converter Feature

The Notes Converter is a frontend feature that allows users to transform their text notes into various interactive formats directly in the browser, with no backend service required.

## Features

- Convert text and PDF files into:
  - Audio podcasts using browser Text-to-Speech (TTS)
  - Video lessons with synchronized slides and audio
  - Interactive storybooks with page transitions

## Technical Implementation

### Components

- `NotesConverter`: Main component that orchestrates the conversion process
- `FileUpload`: Handles file upload with drag-and-drop support
- `ConversionType`: Selection interface for conversion formats
- `Preview`: Displays and controls converted content
- `Storybook`: Interactive page-by-page view for converted notes

### Services

- `TTSService`: Handles text-to-speech conversion using the Web Speech API
- `VideoGenerator`: Creates video presentations using Canvas API
- `StorybookGenerator`: Splits content into pages for the storybook format

### Error Handling

The feature includes comprehensive error handling for:
- File validation (type, size)
- Browser compatibility checks
- Conversion process errors
- User feedback and recovery options

## Usage

1. Upload a text or PDF file (max 10MB)
2. Select the desired conversion format:
   - Audio: Creates an MP3 podcast
   - Video: Generates a WebM video with slides
   - Storybook: Creates an interactive page viewer
3. Click "Convert Notes" to process the content
4. Preview and download the converted content

## Technical Requirements

- Modern browser with support for:
  - Web Speech API
  - Canvas API
  - MediaRecorder API
  - File API

## Contribution Guidelines

When contributing to the Notes Converter feature:

1. Follow the existing component and file structure
2. Use Tailwind CSS for styling
3. Implement proper error handling
4. Add responsive design considerations
5. Include TypeScript type definitions
6. Write clear comments and documentation

## Future Enhancements

Potential improvements to consider:

- Support for more input formats (Markdown, Word docs)
- Additional conversion options (presentation slides)
- Custom TTS voice selection
- Save conversion preferences
- Batch processing multiple files

## Security Considerations

The feature:
- Processes all content client-side
- Validates file types and sizes
- Uses browser security sandboxing
- Does not store or transmit user data