# JI

A React-based 3D animation system for visualizing judo techniques using Three.js and React Three Fiber.

## Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Build for production
yarn build

# Preview production build
yarn preview
```

## Features

- 3D humanoid model with articulated joints
- Support for multiple judo techniques
- Toggle-based walking animation
- Keyboard shortcuts for technique selection
- Interactive technique cards with ON/OFF states
- Smooth animation transitions
- Error handling and recovery

## Components

### Scene
- 3D environment setup with proper lighting and camera controls
- Manages the humanoid model and animation state

### Humanoid
- Fully articulated 3D model with:
  - Head and body
  - Articulated arms (upper/lower) with hands
  - Articulated legs (upper/lower) with feet
  - Yellow joint indicators for better visualization

### Animation System
- Keyframe-based animation system
- Support for:
  - Single-play techniques
  - Looping animations (like walking)
  - Toggle-based animations
  - Default stopped state

### Technique Cards
- Compact UI for technique selection
- Shows technique details:
  - Name in English
  - Japanese name
  - Category
  - Difficulty level
- Toggle state indicator for continuous animations

## Usage

### Keyboard Shortcuts
- `1`: First technique
- `2`: Second technique

### Mouse/Touch
- Click technique cards to execute techniques
- Toggle walking animation ON/OFF
- Use OrbitControls to rotate and zoom the view

## Technical Implementation

### Key Technologies
- React
- TypeScript
- Three.js
- React Three Fiber
- React Three Drei

### Animation Architecture
- Uses React's `useFrame` for animation updates
- Implements keyframe interpolation
- Handles animation state management
- Provides error recovery mechanisms

## Development

```bash
# Run linter
yarn lint

# Type checking
yarn tsc
```

## Testing
The project uses Jest and React Testing Library for testing. Tests are located next to their corresponding components with the `.test.ts` or `.test.tsx` extension.

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

## Future Enhancements
Potential areas for future development:
- Additional judo techniques
- More complex animations
- Physics-based interactions
- Performance optimizations
- Mobile responsiveness improvements


# GoKyo

# https://en.wikipedia.org/wiki/List_of_Kodokan_judo_techniques
