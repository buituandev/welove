import {
    Canvas,
    Shader,
    Skia,
    useClock,
    vec
} from '@shopify/react-native-skia';
import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    runOnJS,
    useDerivedValue,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

/**
 * GLSL SHADER CODE
 * This creates the "soft, drifting dust" effect.
 * It generates random noise, filters it to only show bright specks,
 * and moves them slowly over time.
 */
const dustShader = Skia.RuntimeEffect.Make(`
  uniform float u_time;
  uniform vec2 u_resolution;

  // Simple pseudo-random function
  float random (vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // Smooth Noise function
  float noise (in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      // Four corners in 2D of a tile
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
  }

  vec4 main(vec2 pos) {
      vec2 st = pos.xy / u_resolution.xy;
      
      // 1. Slow drifting movement
      // We offset the coordinate system by time
      float moveX = u_time * 0.05; // Horizontal drift speed
      float moveY = u_time * 0.02; // Vertical drift speed
      
      // 2. Generate Noise Layers
      // Layer 1: Base Fog
      float n1 = noise(st * 3.0 + vec2(moveX, moveY));
      
      // Layer 2: Small Particles (High frequency noise)
      // We multiply coordinates by 40.0 to make the noise "tiny"
      float n2 = random(st * 40.0 + vec2(moveX * 0.5, moveY * 0.5));
      
      // 3. Create "Dust Motes"
      // We only keep noise values above 0.95 (the top 5% brightest spots)
      // This turns a solid noise field into tiny scattered dots
      float particles = 0.0;
      if (n2 > 0.95) {
        particles = (n2 - 0.95) * 60.0; // Boost brightness of the specks
      }

      // 4. Combine
      // Mix dark background with soft fog (n1) and sharp particles
      vec3 color = vec3(0.16, 0.16, 0.16); // Dark Grey Base (#2A2A2A)
      
      // Add fog
      color += vec3(0.1) * n1;
      
      // Add particles (white)
      // Use (0.5 + 0.5*sin) to keep the twinkle positive
      float twinkle = 0.5 + 0.5 * sin(u_time * 3.0 + st.x * 20.0);
      color += vec3(0.9) * particles * twinkle;

      return vec4(color, 1.0);
  }
`)!;

interface SpoilerProps {
    children: React.ReactNode;
    style?: any;
}

export const Spoiler = ({ children, style }: SpoilerProps) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [canvasVisible, setCanvasVisible] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Reanimated value for opacity transition
    const opacity = useSharedValue(1);

    // Skia Clock for animation loop
    const clock = useClock();

    // Feed uniforms to the shader every frame
    const uniforms = useDerivedValue(() => {
        return {
            u_time: clock.value / 1000, // Convert ms to seconds
            u_resolution: vec(dimensions.width, dimensions.height),
        };
    }, [dimensions]);

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
    };

    const handlePress = () => {
        if (!isRevealed) {
            setIsRevealed(true);
            opacity.value = withTiming(0, { duration: 800 }, (finished) => {
                if (finished) {
                    runOnJS(setCanvasVisible)(false);
                }
            });
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            style={[styles.container, isRevealed && styles.revealedContainer, style]}
        >
            {/* 1. The Content (Hidden initially) */}
            <View
                onLayout={handleLayout}
                style={[styles.contentContainer, { opacity: isRevealed ? 1 : 0 }]}
            >
                <Animated.View style={isRevealed ? styles.fadeIn : undefined}>
                    {children}
                </Animated.View>
            </View>

            {/* 2. The Skia Canvas (The "Cloud") */}
            {/* It sits absolutely on top of the content. We keep it rendered to allow fade-out animation. */}
            {canvasVisible && dimensions.width > 0 && (
                <Animated.View
                    style={[StyleSheet.absoluteFill, { opacity }]}
                    pointerEvents="none"
                >
                    <Canvas style={{ flex: 1 }}>
                        <Shader source={dustShader} uniforms={uniforms} />
                    </Canvas>
                </Animated.View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    appContainer: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        color: '#a5d6a7',
        fontSize: 24,
        marginBottom: 40,
        fontWeight: '300',
    },
    text: {
        color: '#e0e0e0',
        fontSize: 18,
        lineHeight: 28,
    },

    // Spoiler Specific Styles
    container: {
        borderRadius: 6,
        overflow: 'hidden',
        // Align vertically with text
        transform: [{ translateY: 6 }],
        backgroundColor: '#2A2A2A', // Fallback background
    },
    revealedContainer: {
        backgroundColor: 'transparent',
    },
    contentContainer: {
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    spoilerText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    fadeIn: {
        // Optional extra fade in for the text itself
    }
});