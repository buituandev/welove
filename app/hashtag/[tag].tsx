import HashtagPostsScreen from '@/app/_screens/HashtagPosts';
import { useLocalSearchParams } from 'expo-router';

export default function HashtagPostsRoute() {
    const { tag } = useLocalSearchParams<{ tag: string }>();
    return <HashtagPostsScreen tag={decodeURIComponent(tag ?? '')} />;
}
