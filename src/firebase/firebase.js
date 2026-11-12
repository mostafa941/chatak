import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export const listenForChats = (setChats) => {
  const chatsRef = collection(db, "chats");
  const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
    const chatList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const currentEmail = auth?.currentUser?.email;
    const filteredChats = chatList.filter((chat) =>
      chat?.users?.some((user) => user?.email === currentEmail)
    );

    setChats(filteredChats);
  });

  return unsubscribe;
};

export const sendMessage = async (messageText, chatId, user1, user2) => {
  const chatRef = doc(db, "chats", chatId);

  const user1Doc = await getDoc(doc(db, "users", user1));
  const user2Doc = await getDoc(doc(db, "users", user2));

  const user1Data = user1Doc.data();
  const user2Data = user2Doc.data();

  const chatDoc = await getDoc(chatRef);
  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      users: [user1Data, user2Data],
      lastMessage: messageText,
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSender: auth.currentUser.email,
    });
  } else {
    await updateDoc(chatRef, {
      lastMessage: messageText,
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSender: auth.currentUser.email,
    });
  }

  const messageRef = collection(db, "chats", chatId, "messages");

  await addDoc(messageRef, {
    text: messageText,
    sender: auth.currentUser.email,
    timestamp: serverTimestamp(),
    read: false,
  });

  // Add notification for the receiver
  const receiverUid = user1 === auth.currentUser.uid ? user2 : user1;
  const senderData = user1 === auth.currentUser.uid ? user1Data : user2Data;
  const notificationsRef = collection(db, "notifications");

  await addDoc(notificationsRef, {
    receiverUid: receiverUid,
    senderUid: auth.currentUser.uid,
    senderName: senderData?.fullName || "Chat User",
    senderImage: senderData?.image || "",
    senderUsername: senderData?.username || "",
    senderBio: senderData?.bio || "",
    message: messageText,
    chatId: chatId,
    timestamp: serverTimestamp(),
    read: false,
  });
};

export const listenForMessages = (chatId, setMessages) => {
  const chatRef = collection(db, "chats", chatId, "messages");
  const unsubscribe = onSnapshot(chatRef, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMessages(messages);
  });
  return unsubscribe;
};

export const listenForNotifications = (uid, callback) => {
  const notificationsRef = collection(db, "notifications");
  const q = query(
    notificationsRef,
    where("receiverUid", "==", uid),
    where("read", "==", false)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(notifications);
    },
    (err) => {
      console.error("Error listening for notifications:", err);
    }
  );

  return unsubscribe;
};

export const markNotificationsAsRead = async (notifications) => {
  if (!notifications || notifications.length === 0) return;
  try {
    const promises = notifications.map((notification) => {
      const notifRef = doc(db, "notifications", notification.id);
      return updateDoc(notifRef, { read: true });
    });
    await Promise.all(promises);
  } catch (err) {
    console.error("Error marking notifications as read:", err);
  }
};

export const markMessagesAsRead = async (chatId, currentUserEmail, currentUserUid) => {
  if (!chatId) return;
  try {
    // 1. Mark messages in this chat as read
    const messagesRef = collection(db, "chats", chatId, "messages");
    const snapshot = await getDocs(messagesRef);
    const msgUpdates = [];
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.sender !== currentUserEmail && data.read !== true) {
        msgUpdates.push(
          updateDoc(doc(db, "chats", chatId, "messages", docSnap.id), {
            read: true,
          })
        );
      }
    });
    await Promise.all(msgUpdates);

    // 2. Mark corresponding notifications as read
    if (currentUserUid) {
      const notifsRef = collection(db, "notifications");
      const q = query(
        notifsRef,
        where("receiverUid", "==", currentUserUid),
        where("chatId", "==", chatId),
        where("read", "==", false)
      );
      const notifSnap = await getDocs(q);
      const notifUpdates = [];
      notifSnap.docs.forEach((docSnap) => {
        notifUpdates.push(
          updateDoc(doc(db, "notifications", docSnap.id), { read: true })
        );
      });
      await Promise.all(notifUpdates);
    }
  } catch (err) {
    console.error("Error marking messages as read:", err);
  }
};

export const getUnreadCountForChat = (chatId, currentUserEmail, callback) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const unsubscribe = onSnapshot(
    messagesRef,
    (snapshot) => {
      const unread = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.sender !== currentUserEmail && data.read !== true;
      }).length;
      callback(unread);
    },
    (err) => {
      console.error("Error listening for unread count:", err);
    }
  );
  return unsubscribe;
};

export const searchUsers = async (searchTerm) => {
  const normalizedSearchTerm = searchTerm.toLowerCase().trim();

  // Search by username
  const usernameQuery = query(
    collection(db, "users"),
    where("username", ">=", normalizedSearchTerm),
    where("username", "<=", normalizedSearchTerm + "\uf8ff")
  );

  const usernameSnapshot = await getDocs(usernameQuery);
  const results = [];
  usernameSnapshot.forEach((doc) => {
    results.push(doc.data());
  });

  // Search by fullName
  const nameQuery = query(
    collection(db, "users"),
    where("fullName", ">=", searchTerm),
    where("fullName", "<=", searchTerm + "\uf8ff")
  );

  const nameSnapshot = await getDocs(nameQuery);
  nameSnapshot.forEach((doc) => {
    const data = doc.data();
    if (!results.some((u) => u.uid === data.uid)) {
      results.push(data);
    }
  });

  return results;
};

export const updateUserProfile = async (uid, data) => {
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, data);

  // Sync profile changes (fullName, image, bio) across all chat documents
  try {
    const chatsRef = collection(db, "chats");
    const snapshot = await getDocs(chatsRef);
    const chatUpdates = [];
    snapshot.docs.forEach((chatDoc) => {
      const chatData = chatDoc.data();
      if (chatData?.users?.some((u) => u.uid === uid)) {
        const updatedUsers = chatData.users.map((u) =>
          u.uid === uid ? { ...u, ...data } : u
        );
        chatUpdates.push(
          updateDoc(doc(db, "chats", chatDoc.id), {
            users: updatedUsers,
          })
        );
      }
    });
    await Promise.all(chatUpdates);
  } catch (err) {
    console.error("Error updating user across chats:", err);
  }
};

export { auth, db, storage };
