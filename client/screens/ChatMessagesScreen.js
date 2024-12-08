import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import React, { useState, useEffect, useRef, useContext } from "react";
import { Entypo, Feather } from "@expo/vector-icons";
import EmojiSelector from "react-native-emoji-selector";
import { UserType } from "./UserContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { BASEURL } from "../constants";

const ChatMessagesScreen = () => {
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [recepientData, setRecepientData] = useState(null);
  const [message, setMessage] = useState("");
  const { userId } = useContext(UserType);
  const route = useRoute();
  const navigation = useNavigation();
  const { recipientId } = route.params;
  const scrollViewRef = useRef(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      console.log("userId:", userId, "item._id:", item._id);
      const response = await fetch(`${BASEURL}/messages/${userId}/${recipientId}`);
      console.log("Raw response:", response);
  
      // Check for non-JSON response
      if (!response.ok) {
        const text = await response.text(); // Parse as plain text
        console.log("Response text:", text);
        return;
      }
  
      const data = await response.json();
      setMessages(data.data || []);
    } catch (error) {
      console.log("Error fetching messages:", error);
    }
  };
  
  // useEffect(() => {
  //   console.log("Route params:", route.params);
  //   const { recipientId } = route.params;
  
  //   if (!recipientId) {
  //     console.error("Recipient ID is undefined. Navigation is broken.");
  //     return;
  //   }
  
  //   fetchMessages();
  // }, [route.params]);
  
  // Fetch recipient data
  useEffect(() => {
    const fetchRecepientData = async () => {
      if (!recipientId) return;

      try {
        const response = await fetch(`${BASEURL}/user/${recipientId}`);
        const data = await response.json();
        setRecepientData(data);
      } catch (error) {
        console.log("Error retrieving recipient details:", error);
      }
    };

    fetchRecepientData();
  }, [recipientId]);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleEmojiPress = () => {
    setShowEmojiSelector((prev) => !prev);
  };

  const handleSend = async (messageType, imageUri) => {
    if (!userId || !recipientId) return;

    try {
      const formData = new FormData();
      formData.append("senderId", userId);
      formData.append("recipientId", recipientId);

      if (messageType === "image") {
        formData.append("messageType", "image");
        formData.append("imageFile", {
          uri: imageUri,
          name: "image.jpg",
          type: "image/jpeg",
        });
      } else {
        formData.append("messageType", "text");
        formData.append("messageText", message);
      }

      const response = await fetch(`${BASEURL}/messages`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setMessage("");
        fetchMessages();
      }
    } catch (error) {
      console.log("Error sending message:", error);
    }
  };

  const deleteMessages = async (messageIds) => {
    try {
      const response = await fetch(`${BASEURL}/deleteMessages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: messageIds }),
      });

      if (response.ok) {
        setMessages((prev) => prev.filter((msg) => !messageIds.includes(msg._id)));
        setSelectedMessages([]);
      }
    } catch (error) {
      console.log("Error deleting messages:", error);
    }
  };
  const handleSelectMessage = (message) => {
    const isSelected = selectedMessages.includes(message._id);
  
    if (isSelected) {
      setSelectedMessages((prev) =>
        prev.filter((id) => id !== message._id)
      );
    } else {
      setSelectedMessages((prev) => [...prev, message._id]);
    }
  };

  const formatTime = (time) => {
    const options = { hour: "numeric", minute: "numeric" };
    return new Date(time).toLocaleString("en-US", options);
  };

  const pickImage = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
      if (!permissionResult.granted) {
        alert("Permission to access the gallery is required!");
        return;
      }
  
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      if (!result.canceled) {
        const selectedImageUri = result.assets[0].uri; // Access the selected image URI
        handleSend("image", selectedImageUri); // Pass it to the handleSend function
      } else {
        console.log("Image selection canceled.");
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };
  
  
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F0F0F0" }}>
      <ScrollView
  ref={scrollViewRef}
  contentContainerStyle={{ flexGrow: 1 }}
  onContentSizeChange={() => scrollToBottom()}
>
{messages.map((item) => {
  if (item.messageType === "text") {
    const isSelected = selectedMessages.includes(item._id);

    // Safeguard against missing properties
    const message = item?.message || "Message content not available";
    const timeStamp = item?.timeStamp || Date.now();

    return (
      <Pressable
        key={item._id} // Ensure _id is unique
        onLongPress={() => handleSelectMessage(item)}
        style={[
          // Conditional styling for sender/recipient
          item?.senderId === userId
            ? {
                alignSelf: "flex-end",
                backgroundColor: "#DCF8C6",
                padding: 8,
                maxWidth: "60%",
                borderRadius: 7,
                margin: 10,
              }
            : {
                alignSelf: "flex-start",
                backgroundColor: "white",
                padding: 8,
                margin: 10,
                borderRadius: 7,
                maxWidth: "60%",
              },
          // Highlight selected messages
          isSelected && { backgroundColor: "#F0FFFF", width: "100%" },
        ]}
      >
        {/* Message Content */}
        <Text style={{ fontSize: 13, textAlign: isSelected ? "right" : "left" }}>
          {message}
        </Text>

        {/* Timestamp */}
        <Text
          style={{
            textAlign: "right",
            fontSize: 9,
            color: "gray",
            marginTop: 5,
          }}
        >
          {formatTime(timeStamp)}
        </Text>
      </Pressable>
    );
  }
  if (item.messageType === "image") {
    const imageUrl = `${BASEURL}/files/${item.imageUrl}`;
    return (
      <Pressable
        key={item._id} // Ensure _id is unique
        style={[
          item?.senderId === userId
            ? {
                alignSelf: "flex-end",
                backgroundColor: "#DCF8C6",
                padding: 8,
                maxWidth: "60%",
                borderRadius: 7,
                margin: 10,
              }
            : {
                alignSelf: "flex-start",
                backgroundColor: "white",
                padding: 8,
                margin: 10,
                borderRadius: 7,
                maxWidth: "60%",
              },
        ]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 200, height: 200, borderRadius: 7 }}
        />
        <Text
          style={{
            textAlign: "right",
            fontSize: 9,
            color: "white",
            marginTop: 5,
            position: "absolute",
            right: 10,
            bottom: 7,
          }}
        >
          {formatTime(item?.timeStamp)}
        </Text>
      </Pressable>
    );
  }
  return null;
})}
</ScrollView>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: "#dddddd",
          marginBottom: showEmojiSelector ? 0 : 25,
        }}
      >
        <Entypo
          onPress={handleEmojiPress}
          style={{ marginRight: 5 }}
          name="emoji-happy"
          size={24}
          color="gray"
        />

        <TextInput
          value={message}
          onChangeText={(text) => setMessage(text)}
          style={{
            flex: 1,
            height: 40,
            borderWidth: 1,
            borderColor: "#dddddd",
            borderRadius: 20,
            paddingHorizontal: 10,
          }}
          placeholder="Type Your message..."
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            marginHorizontal: 8,
          }}
        >
          <Entypo onPress={pickImage} name="camera" size={24} color="gray" />

          <Feather name="mic" size={24} color="gray" />
        </View>

        <Pressable
          onPress={() => handleSend("text")}
          style={{
            backgroundColor: "#007bff",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
        </Pressable>
      </View>

      {showEmojiSelector && (
        <EmojiSelector
          onEmojiSelected={(emoji) => {
            setMessage((prevMessage) => prevMessage + emoji);
          }}
          style={{ height: 250 }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default ChatMessagesScreen;

const styles = StyleSheet.create({});
