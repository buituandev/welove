import React, { memo, useCallback } from "react";
import { View } from "react-native";
import { Comment } from "../../types/comment";
import { CommentItem } from "./CommentItem";
import { RepliesSection } from "./RepliesSection";

export interface CommentBlockProps {
    item: Comment;
    vm: any;
    t: any;
}

export const CommentBlock = memo(({ item, vm, t }: CommentBlockProps) => {
    const isExpanded = !!vm.expandedCommentIds[item.id];
    const onToggleExpand = useCallback(() => {
        vm.toggleExpandComment(item.id);
    }, [vm, item.id]);

    return (
        <View style={{ marginBottom: 12 }}>
            <CommentItem
                comment={item}
                colors={vm.colors}
                common={vm.common}
                theme={vm.theme}
                isOwn={!!vm.currentProfileId && String(vm.currentProfileId) === String(item.profile_id)}
                onPress={() => vm.handleUserPress(item)}
                onDelete={() => vm.handleDeleteComment(item)}
                onEdit={() => vm.handleEditComment(item)}
                formatTimeAgo={vm.formatTimeAgo}
                editLabel={t('post.commentsSheet.actionEdit')}
                deleteLabel={t('post.commentsSheet.actionDelete')}
                replyLabel={t('post.commentsSheet.actionReply', 'Reply')}
                isDeleting={vm.deletingId === item.id}
                onReply={() => vm.handleReplyToComment(item)}
            />
            {vm.postId && (
                <RepliesSection
                    postId={vm.postId}
                    parentComment={item}
                    colors={vm.colors}
                    common={vm.common}
                    theme={vm.theme}
                    currentProfileId={vm.currentProfileId}
                    onUserPress={vm.handleUserPress}
                    onDeleteComment={vm.handleDeleteComment}
                    onEditComment={vm.handleEditComment}
                    onReplyComment={vm.handleReplyToComment}
                    formatTimeAgo={vm.formatTimeAgo}
                    deletingId={vm.deletingId}
                    editLabel={t('post.commentsSheet.actionEdit')}
                    deleteLabel={t('post.commentsSheet.actionDelete')}
                    replyLabel={t('post.commentsSheet.actionReply', 'Reply')}
                    isExpanded={isExpanded}
                    onToggleExpand={onToggleExpand}
                    t={t}
                />
            )}
        </View>
    );
});

CommentBlock.displayName = "CommentBlock";
