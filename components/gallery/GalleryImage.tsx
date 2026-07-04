import { Image as ExpoImage } from 'expo-image';
import React, { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { fitContainer } from 'react-native-zoom-toolkit';
import { getCachedImageDimension, setCachedImageDimension } from './imageDimensionCache';

type GalleryImageProps = {
    uri: string;
    index: number;
    blurhash?: string | null;
};

const GalleryImage: React.FC<GalleryImageProps> = ({ uri }) => {
    const { width, height } = useWindowDimensions();

    // Seed the resolution from MMKV cache so the layout is correct on first render.
    const cachedResolution = getCachedImageDimension(uri);
    const [resolution, setResolution] = useState<{ width: number; height: number }>(
        cachedResolution ?? { width: 1, height: 1 }
    );

    const size = fitContainer(resolution.width / resolution.height, { width, height });

    return (
        <View style={[size, { justifyContent: 'center', alignItems: 'center' }]}>
            <ExpoImage
                source={{ uri }}
                recyclingKey={uri}
                contentFit="contain"
                style={{ width: '100%', height: '100%' }}
                onLoad={(event) => {
                    const { width: imgWidth, height: imgHeight } = event.source;
                    if (imgWidth > 0 && imgHeight > 0) {
                        setCachedImageDimension(uri, imgWidth, imgHeight);
                        setResolution({ width: imgWidth, height: imgHeight });
                    }
                }}
            />
        </View>
    );
};

export default React.memo(GalleryImage);
