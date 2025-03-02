import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const PINK = '#ff5f96';
const CARD_RADIUS = 12;

// Helper function to format Firestore timestamps
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  if (timestamp.seconds) {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString();
  }
  return new Date(timestamp).toLocaleDateString();
};

export default function MyPostsScreen() {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);

  // Listen to Firestore for posts created by the current user
  useEffect(() => {
    if (auth.currentUser) {
      const q = query(
        collection(db, 'communityPosts'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedPosts = [];
          snapshot.forEach((docSnap) => {
            loadedPosts.push({ id: docSnap.id, ...docSnap.data() });
          });
          setPosts(loadedPosts);
        },
        (error) => {
          Alert.alert("Error", error.message);
        }
      );
      return () => unsubscribe();
    }
  }, []);

  // Delete post function
  const handleDeletePost = async (post) => {
    try {
      await deleteDoc(doc(db, 'communityPosts', post.id));
      Alert.alert("Post deleted successfully");
    } catch (error) {
      Alert.alert("Error deleting post", error.message);
    }
  };

  // Render each post card using enhanced UI styling
  const renderItem = ({ item }) => {
    const likedBy = item.likedBy || [];
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: "https://via.placeholder.com/40" }}
              style={styles.userAvatar}
            />
            <View style={styles.postHeaderText}>
              <Text style={styles.userName}>
                {item.userName || "Unknown User"}
              </Text>
              <Text style={styles.dateText}>
                Posted on: {formatTimestamp(item.createdAt)}
              </Text>
            </View>
          </View>
          {auth.currentUser && item.userId === auth.currentUser.uid && (
            <TouchableOpacity onPress={() => handleDeletePost(item)}>
              <Ionicons name="trash" size={22} color="red" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postContent}>{item.content}</Text>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
        )}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart" size={20} color="#666" style={{ marginRight: 5 }} />
            <Text style={styles.actionButtonText}>
              {likedBy.length > 0 ? likedBy.length : 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" style={{ marginRight: 5 }} />
            <Text style={styles.actionButtonText}>
              {item.commentCount ? item.commentCount : 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={20} color="#666" style={{ marginRight: 5 }} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Posts</Text>
      </View>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.postsList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>You haven't created any posts yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  header: {
    backgroundColor: PINK,
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    top: 15,
    marginBottom: 5,
    paddingVertical: 10,
  },
  postsList: { padding: 16 },
  emptyText: { textAlign: "center", color: "#777", marginTop: 20, fontSize: 16 },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: CARD_RADIUS,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  userAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: PINK,
  },
  postHeaderText: { marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: "600", color: "#333" },
  dateText: { fontSize: 12, color: "#999", marginTop: 4 },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 4,
  },
  postContent: { fontSize: 15, color: "#444", marginBottom: 10 },
  postImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: "cover",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  actionButton: { flexDirection: "row", alignItems: "center" },
  actionButtonText: { fontSize: 15, color: "#666", marginLeft: 4 },
});
