import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  Share,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
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
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';

import { auth, db, storage } from '../../config/firebaseConfig'; 
// Make sure 'storage' is exported from firebaseConfig if using Firebase Storage

const PINK = '#ff5f96';
const CARD_RADIUS = 10;

export default function CommunityScreen() {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState([]);

  // For the create-post modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Post form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState(null);

  // Comment modal states
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);

  // 1) Listen to Firestore for community posts in real time
  useEffect(() => {
    const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPosts = [];
      snapshot.forEach((docSnap) => {
        loadedPosts.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPosts(loadedPosts);
    });
    return () => unsubscribe(); // cleanup
  }, []);

  // Subscribe to comments when a post is selected for commenting
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

  // 2) Search
  const handleSearchSubmit = () => {
    console.log('Search submitted:', searchTerm);
    // Optionally filter or navigate based on searchTerm
  };

  // 3) Like toggling
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

  // 4) Share
  const handleSharePost = async (post) => {
    try {
      await Share.share({
        message: `Check out this post: "${post.title}"\n\n${post.content}`,
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // 5) Comment feature: Open comment modal
  const handleCommentPost = (post) => {
    setSelectedPost(post);
    setCommentText('');
    setCommentModalVisible(true);
  };

  // Submit comment: Save comment in subcollection 'comments'
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
      Alert.alert('Success', 'Comment posted!');
      setCommentText('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Delete comment (only if current user posted the comment)
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteDoc(doc(db, 'communityPosts', selectedPost.id, 'comments', commentId));
      Alert.alert('Comment deleted');
    } catch (error) {
      Alert.alert('Error deleting comment', error.message);
    }
  };

  // Delete post (only if current user owns the post)
  const handleDeletePost = async (post) => {
    try {
      await deleteDoc(doc(db, 'communityPosts', post.id));
      Alert.alert("Post deleted successfully");
    } catch (error) {
      Alert.alert("Error deleting post", error.message);
    }
  };

  // =============== CREATE POST MODAL LOGIC ===============
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
      console.log("Uploading image from URI:", uri);
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log("Blob created:", blob);
      const filename = `communityImages/${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const storageRef = ref(storage, filename);
      const uploadTask = uploadBytesResumable(storageRef, blob);
      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL:", downloadURL);
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
        const userData = userDocSnap.data();
        userName = userData.name || 'Unknown User';
      }
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImageAsync(imageUri);
        console.log("Image URL to store:", imageUrl);
      }
      await addDoc(collection(db, 'communityPosts'), {
        userId: auth.currentUser.uid,
        userName: userName,
        title: title,
        content: content,
        imageUrl: imageUrl,
        likedBy: [],
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

      {/* Pink Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Community</Text>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Legal Women Rights"
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Posts Scrollable Area */}
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
          {posts.map((post) => {
            const likedBy = post.likedBy || [];
            const isLiked = auth.currentUser && likedBy.includes(auth.currentUser.uid);
            return (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Image
                      source={{ uri: "https://via.placeholder.com/40" }}
                      style={styles.userAvatar}
                    />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.userName}>
                        {post.userName || "Unknown User"}
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
                <Text style={styles.postContent}>{post.content}</Text>
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
                    <Text style={styles.actionButtonText}>Comment</Text>
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
              </View>
            );
          })}
        </View>
      </KeyboardAwareScrollView>

      {/* CREATE POST MODAL with KeyboardAvoidingView */}
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

      {/* COMMENT MODAL with KeyboardAvoidingView */}
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
        <Ionicons name="sparkles" size={28} color="#fff" />
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
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
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
  searchInput: {
    flex: 1,
    color: "#666",
    fontSize: 15,
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
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userAvatar: { width: 40, height: 40, borderRadius: 20 },
  userName: { fontSize: 15, fontWeight: "600", color: "#333" },
  postTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 4 },
  postContent: { fontSize: 14, color: "#444", marginBottom: 8 },
  postImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: "cover",
  },
  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  actionButton: { flexDirection: "row", alignItems: "center" },
  actionButtonText: { fontSize: 14, color: "#666" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#fff", borderRadius: 15, padding: 20, maxHeight: "90%", alignSelf: "center", width: "100%" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15, color: "#333", textAlign: "center" },
  modalInput: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },
  previewImage: { width: "100%", height: 200, borderRadius: 8, resizeMode: "cover", marginBottom: 10 },
  pickImageButton: {
    backgroundColor: "#999",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  pickImageText: { color: "#fff", fontWeight: "600" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  modalButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
  modalButtonText: { color: "#fff", fontWeight: "600" },
  floatingButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: PINK,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 100,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 4,
  },
  commentUser: { fontWeight: "bold", color: "#333" },
  commentText: { flex: 1, marginLeft: 10, color: "#555" },
});
