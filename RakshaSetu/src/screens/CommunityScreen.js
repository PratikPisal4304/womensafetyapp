import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  Share,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  increment,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';
import { auth, db, storage } from '../../config/firebaseConfig';

const PINK = '#ff5f96';
const CARD_RADIUS = 10;

// Helper function to format Firestore timestamps into local date strings.
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  if (timestamp.seconds) {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString();
  }
  return new Date(timestamp).toLocaleDateString();
};

/**
 * PostCard Component
 * - Renders each post with its UI.
 * - Listens for double taps.
 * - If the post is not already liked, a double tap toggles the like and plays an animation.
 * - If the post is already liked, a double tap simply removes the like without triggering animation.
 * - If the content is long, shows a "Read more..." option after 4 lines, and "Read less..." when expanded.
 */
const PostCard = ({
  post,
  handleLikeToggle,
  handleDeletePost,
  handleCommentPost,
  handleSharePost,
}) => {
  const lastTapRef = useRef(0);
  const animation = useRef(new Animated.Value(0)).current;

  const likedBy = post.likedBy || [];
  const isLiked = auth.currentUser && likedBy.includes(auth.currentUser.uid);

  // State for content truncation and read more/less toggle
  const [textExpanded, setTextExpanded] = useState(false);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);

  const handleCardTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      // Double tap detected: toggle like
      handleLikeToggle(post);
      // Only trigger animation if adding a like (i.e. when not already liked)
      if (!isLiked) {
        triggerLikeAnimation();
      }
    } else {
      lastTapRef.current = now;
    }
  };

  const triggerLikeAnimation = () => {
    animation.setValue(0);
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
  });

  // Handle text layout to check number of lines
  const onTextLayout = (e) => {
    if (!textExpanded && e.nativeEvent.lines.length > 4) {
      setShouldShowReadMore(true);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleCardTap}>
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Image
              source={{ uri: "https://via.placeholder.com/40" }}
              style={styles.userAvatar}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.userName}>{post.userName || "Unknown User"}</Text>
              <Text style={styles.dateText}>
                Posted on: {formatTimestamp(post.createdAt)}
              </Text>
            </View>
          </View>
          {auth.currentUser && post.userId === auth.currentUser.uid && (
            <TouchableOpacity onPress={() => handleDeletePost(post)}>
              <Ionicons name="trash" size={20} color="red" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.postTitle}>{post.title}</Text>
        <View>
          <Text
            style={styles.postContent}
            numberOfLines={textExpanded ? undefined : 4}
            onTextLayout={onTextLayout}
          >
            {post.content}
          </Text>
          {shouldShowReadMore && !textExpanded && (
            <TouchableOpacity onPress={() => setTextExpanded(true)}>
              <Text style={styles.readMore}>Read more...</Text>
            </TouchableOpacity>
          )}
          {shouldShowReadMore && textExpanded && (
            <TouchableOpacity onPress={() => setTextExpanded(false)}>
              <Text style={styles.readMore}>Read less...</Text>
            </TouchableOpacity>
          )}
        </View>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
        ) : null}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikeToggle(post)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? "red" : "#666"}
              style={{ marginRight: 5 }}
            />
            <Text style={styles.actionButtonText}>
              {likedBy.length > 0 ? likedBy.length : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCommentPost(post)}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color="#666"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.actionButtonText}>
              {post.commentCount ? post.commentCount : 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSharePost(post)}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color="#666"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
        {/* Animated heart overlay */}
        <Animated.View
          style={[
            styles.heartOverlay,
            { opacity: animation, transform: [{ scale }] },
          ]}
        >
          <Ionicons name="heart" size={80} color="red" />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default function CommunityScreen() {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState([]);

  // Create post modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState(null);

  // Comment modal states
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);

  // Listen to Firestore for community posts in real time.
  useEffect(() => {
    const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPosts = [];
      snapshot.forEach((docSnap) => {
        loadedPosts.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPosts(loadedPosts);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to comments when a post is selected for commenting.
  useEffect(() => {
    if (selectedPost) {
      const commentQuery = query(
        collection(db, 'communityPosts', selectedPost.id, 'comments'),
        orderBy('createdAt', 'asc')
      );
      const unsubscribeComments = onSnapshot(commentQuery, (snapshot) => {
        const loadedComments = [];
        snapshot.forEach((docSnap) => {
          loadedComments.push({ id: docSnap.id, ...docSnap.data() });
        });
        setComments(loadedComments);
      });
      return () => unsubscribeComments();
    }
  }, [selectedPost]);

  // Filter posts based on search term (title, content, and user profile).
  const filteredPosts =
    searchTerm.trim() === ''
      ? posts
      : posts.filter(
          (post) =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.userName &&
              post.userName.toLowerCase().includes(searchTerm.toLowerCase()))
        );

  // Compute search suggestions from matching post titles and user names.
  const suggestionsSet = new Set();
  filteredPosts.forEach((post) => {
    if (post.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      suggestionsSet.add(post.title);
    }
    if (post.userName && post.userName.toLowerCase().includes(searchTerm.toLowerCase())) {
      suggestionsSet.add(post.userName);
    }
  });
  const suggestions = Array.from(suggestionsSet);

  const handleSearchSubmit = () => {
    console.log('Search submitted:', searchTerm);
    // Additional navigation or logic can be added here.
  };

  // Like toggling.
  const handleLikeToggle = async (post) => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to like posts.');
      return;
    }
    try {
      const userId = auth.currentUser.uid;
      const alreadyLiked = post.likedBy?.includes(userId);
      const postRef = doc(db, 'communityPosts', post.id);
      if (alreadyLiked) {
        await updateDoc(postRef, { likedBy: arrayRemove(userId) });
      } else {
        await updateDoc(postRef, { likedBy: arrayUnion(userId) });
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSharePost = async (post) => {
    try {
      await Share.share({
        message: `Check out this post: "${post.title}"\n\n${post.content}`,
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCommentPost = (post) => {
    setSelectedPost(post);
    setCommentText('');
    setCommentModalVisible(true);
  };

  const handleSubmitComment = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to comment.');
      return;
    }
    if (!commentText.trim()) {
      Alert.alert('Error', 'Comment cannot be empty.');
      return;
    }
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let userName = 'Anonymous';
      if (userDocSnap.exists()) {
        userName = userDocSnap.data().name || 'Anonymous';
      }
      await addDoc(collection(db, 'communityPosts', selectedPost.id, 'comments'), {
        userId: auth.currentUser.uid,
        userName: userName,
        comment: commentText,
        createdAt: serverTimestamp(),
      });
      const postRef = doc(db, 'communityPosts', selectedPost.id);
      await updateDoc(postRef, { commentCount: increment(1) });
      Alert.alert('Success', 'Comment posted!');
      setCommentText('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteDoc(doc(db, 'communityPosts', selectedPost.id, 'comments', commentId));
      const postRef = doc(db, 'communityPosts', selectedPost.id);
      await updateDoc(postRef, { commentCount: increment(-1) });
      Alert.alert('Comment deleted');
    } catch (error) {
      Alert.alert('Error deleting comment', error.message);
    }
  };

  const handleDeletePost = async (post) => {
    try {
      await deleteDoc(doc(db, 'communityPosts', post.id));
      Alert.alert("Post deleted successfully");
    } catch (error) {
      Alert.alert("Error deleting post", error.message);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need gallery access to pick an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log("Picked image URI:", result.assets[0].uri);
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri) => {
    if (!uri) return null;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `communityImages/${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const storageRef = ref(storage, filename);
      const uploadTask = uploadBytesResumable(storageRef, blob);
      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      Alert.alert('Upload Error', error.message);
      return null;
    }
  };

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content are required.');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to create a post.');
      return;
    }
    try {
      setUploading(true);
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let userName = 'Unknown User';
      if (userDocSnap.exists()) {
        userName = userDocSnap.data().name || 'Unknown User';
      }
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImageAsync(imageUri);
      }
      await addDoc(collection(db, 'communityPosts'), {
        userId: auth.currentUser.uid,
        userName: userName,
        title: title,
        content: content,
        imageUrl: imageUrl,
        likedBy: [],
        commentCount: 0,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Post created!');
      setTitle('');
      setContent('');
      setImageUri(null);
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPost = () => {
    setIsModalVisible(false);
    setTitle('');
    setContent('');
    setImageUri(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
  
      {/* Header with Search */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Community</Text>
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={handleSearchSubmit}>
            <MaterialIcons name="search" size={24} color="#666" style={{ marginRight: 8 }} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Posts..."
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
        {searchTerm.trim() !== '' && suggestions.length > 0 && (
          <View style={styles.suggestionContainer}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSearchTerm(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {/* Posts Area */}
      <KeyboardAwareScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.recentPostsHeader}>
            <Text style={styles.sectionTitle}>Recent Posts</Text>
            <TouchableOpacity
              style={styles.createPostButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color={PINK} style={{ marginRight: 4 }} />
              <Text style={styles.createPostButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              handleLikeToggle={handleLikeToggle}
              handleDeletePost={handleDeletePost}
              handleCommentPost={handleCommentPost}
              handleSharePost={handleSharePost}
            />
          ))}
        </View>
      </KeyboardAwareScrollView>
      {/* Create Post Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelPost}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create New Post</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="What's on your mind?"
              placeholderTextColor="#999"
              value={content}
              onChangeText={setContent}
              multiline
            />
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : null}
            <TouchableOpacity style={styles.pickImageButton} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.pickImageText}>Pick an Image</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={handleCancelPost}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: PINK, opacity: uploading ? 0.6 : 1 }]}
                onPress={handleCreatePost}
                disabled={uploading}
              >
                <Text style={styles.modalButtonText}>
                  {uploading ? "Posting..." : "Post"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity
                onPress={() => setCommentModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.safetyContent}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUser}>{comment.userName}</Text>
                    <Text style={styles.commentText}>{comment.comment}</Text>
                    <Text style={styles.commentDate}>
                      {formatTimestamp(comment.createdAt)}
                    </Text>
                  </View>
                  {auth.currentUser && comment.userId === auth.currentUser.uid && (
                    <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                      <Ionicons name="trash" size={18} color="red" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
            <TextInput
              style={styles.modalInput}
              placeholder="Add a comment..."
              placeholderTextColor="#999"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: PINK }]}
              onPress={handleSubmitComment}
            >
              <Text style={styles.modalButtonText}>Submit Comment</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate("GeminiChat")}
      >
        <FontAwesome name="gavel" size={28} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.chatfloatingButton}
        onPress={() => navigation.navigate("InAppChat")}
      >
        <Ionicons name="chatbubbles-sharp" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  headerContainer: {
    backgroundColor: PINK,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  searchInput: { flex: 1, color: "#666", fontSize: 15 },
  suggestionContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 5,
    padding: 10,
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
    paddingVertical: 4,
  },
  scrollContainer: { flex: 1, backgroundColor: "#f8f8f8" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  section: { marginBottom: 24, marginTop: 20 },
  recentPostsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  createPostButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PINK,
  },
  createPostButtonText: { color: PINK, fontWeight: "600" },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: CARD_RADIUS,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  userAvatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2, borderColor: PINK },
  userName: { fontSize: 15, fontWeight: "600", color: "#333", marginLeft: 10 },
  dateText: { fontSize: 12, color: "#999", marginTop: 4, marginLeft: 10 },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 4,
  },
  // Added explicit width to help onTextLayout fire on iOS
  postContent: { fontSize: 15, color: "#555", width: '100%' },
  readMore: { color: PINK, marginTop: 4, fontWeight: "600" },
  postImage: { width: "100%", height: 300, borderRadius: 8, marginTop: 10 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  actionButton: { flexDirection: "row", alignItems: "center" },
  actionButtonText: { fontSize: 14, color: "#666" },
  heartOverlay: { position: "absolute", top: "40%", left: "40%" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#fff", borderRadius: 15, padding: 20, maxHeight: "90%", alignSelf: "center", width: "100%" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15, color: "#333", textAlign: "center" },
  modalInput: { backgroundColor: "#f8f8f8", borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15, color: "#333", borderWidth: 1, borderColor: "#eee", marginBottom: 10 },
  previewImage: { width: "100%", height: 200, borderRadius: 8, resizeMode: "cover", marginBottom: 10 },
  pickImageButton: { backgroundColor: "#999", flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, marginBottom: 20 },
  pickImageText: { color: "#fff", fontWeight: "600" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  modalButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
  modalButtonText: { color: "#fff", fontWeight: "600" },
  floatingButton: { position: "absolute", bottom: 150, right: 20, backgroundColor: PINK, width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, zIndex: 100 },
  chatfloatingButton: { position: "absolute", bottom: 80, right: 20, backgroundColor: PINK, width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, zIndex: 100 },
  commentItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee", marginBottom: 4 },
  commentUser: { fontWeight: "bold", color: "#333" },
  commentText: { flex: 1, marginLeft: 10, color: "#555" },
  commentDate: { fontSize: 12, color: "#999", marginTop: 4 },
});
