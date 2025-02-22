import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";

const EditProfileScreen = () => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");


  const handleSave = () => {
    Alert.alert("Profile Saved", `Name: ${name}\nAge: ${age}\nGender: ${gender}\nAddress: ${address} \nEmail: ${email}`);
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
      <Text style={styles.label}>Name:</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text style={styles.label}>Age:</Text>
      <TextInput value={age} onChangeText={setAge} keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>Gender:</Text>
      <TextInput value={gender} onChangeText={setGender} style={styles.input} />

      <Text style={styles.label}>Address:</Text>
      <TextInput value={address} onChangeText={setAddress} style={styles.input} multiline />

      <Text style={styles.label}>Email:</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} />

      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
};

export default EditProfileScreen;
