import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/FontAwesome';

import axios from 'axios';

export default function App() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processedData, setProcessedData] = useState(null);

  const sendEmail = () => {
    const subject = encodeURIComponent("Meeting Summary");
    const body = encodeURIComponent(
      `Meeting Summary:\n\nKey Points:\n${processedData.meeting_summary.key_points?.join("\n") || "N/A"}\n\nDecisions:\n${processedData.meeting_summary.decisions?.join("\n") || "N/A"}\n\nNext Steps:\n${processedData.meeting_summary.next_steps?.join("\n") || "N/A"}`
    );

    const mailto = `mailto:aditya2410.dev@gmail.com?subject=${subject}&body=${body}`;
    Linking.openURL(mailto);
  };

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Updated recording configuration
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.mp3',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        }
      });

      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording: ' + err.message);
    }
  };


  const stopRecording = async () => {
    try {
      console.log('Stopping recording..');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      setRecording(null);
      await sendAudioToBackend(uri);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const sendAudioToBackend = async (uri) => {
    try {
      setIsLoading(true);
      setTranscript('');
      setProcessedData(null);

      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'recording.mp3',
        type: 'audio/mp3',
      });

      const response = await axios.post('http://192.168.120.253:5000/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minute timeout
        maxContentLength: 50 * 1024 * 1024, // 50MB
        maxBodyLength: 50 * 1024 * 1024 // 50MB
      });

      if (response.data.status === 'success') {
        setTranscript(response.data.transcript);
        setProcessedData({
          calendar_event: response.data.calendar_event,
          todo_items: response.data.todo_items,
          meeting_summary: response.data.meeting_summary
        });
      } else {
        Alert.alert('Error', response.data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to process audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const renderCalendarEvent = () => {
    if (!processedData?.calendar_event) return null;
    const event = processedData.calendar_event;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meeting Details:</Text>
        <Text style={styles.itemText}>Title: {event.title}</Text>
        <Text style={styles.itemText}>Date: {event.date}</Text>
        <Text style={styles.itemText}>Time: {event.time}</Text>
        {event.participants?.length > 0 && (
          <Text style={styles.itemText}>Participants: {event.participants.join(', ')}</Text>
        )}
      </View>
    );
  };


  const renderTodoItems = () => {
    if (!processedData?.todo_items?.length) return null;

    const handleInputChange = (index, field, value) => {
      const updatedItems = [...processedData.todo_items];
      updatedItems[index][field] = value;
      setProcessedData({ ...processedData, todo_items: updatedItems });
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Action Items:</Text>
        {processedData.todo_items.map((item, index) => (
          <View key={index} style={styles.todoItem}>
            <Text style={styles.label}>Task:</Text>
            <TextInput
              style={styles.input}
              value={item.task}
              onChangeText={(text) => handleInputChange(index, 'task', text)}
              placeholder="Task"
              placeholderTextColor="#A0A0A0"
            />

            <Text style={styles.label}>Assignee:</Text>
            <TextInput
              style={styles.input}
              value={item.assignee}
              onChangeText={(text) => handleInputChange(index, 'assignee', text)}
              placeholder="Assignee"
              placeholderTextColor="#A0A0A0"
            />

            <Text style={styles.label}>Deadline:</Text>
            <TextInput
              style={styles.input}
              value={item.deadline}
              onChangeText={(text) => handleInputChange(index, 'deadline', text)}
              placeholder="Deadline"
              placeholderTextColor="#A0A0A0"
            />
          </View>
        ))}
      </View>
    );
  };


  const renderMeetingSummary = () => {
    if (!processedData?.meeting_summary) return null;
    const summary = processedData.meeting_summary;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meeting Summary:</Text>
        {summary.key_points?.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Key Points:</Text>
            {summary.key_points.map((point, index) => (
              <Text key={index} style={styles.itemText}>• {point}</Text>
            ))}
          </View>
        )}
        {summary.decisions?.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Decisions:</Text>
            {summary.decisions.map((decision, index) => (
              <Text key={index} style={styles.itemText}>• {decision}</Text>
            ))}
          </View>
        )}
        {summary.next_steps?.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Next Steps:</Text>
            {summary.next_steps.map((step, index) => (
              <Text key={index} style={styles.itemText}>• {step}</Text>
            ))}
          </View>
        )}
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <TouchableOpacity style={styles.emailButton} onPress={sendEmail}>
            <Icon name="envelope" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Send to Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗣️ SmartVoice</Text>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transcript</Text>
          <Text style={styles.transcriptText}>{transcript || isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8A2BE2" />
              <Text style={styles.loadingText}>I am processing your data, while you can have a cup of Coffee <Icon name="coffee" size={20} color="#fff" />
              </Text>
            </View>
          )}</Text>
        </View>

        {renderCalendarEvent()}
        {renderTodoItems()}
        {renderMeetingSummary()}
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        {isRecording ? (
          <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopRecording}>
            <Icon name="times" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Stop Recording</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.startButton]} onPress={startRecording}>
            <Icon name="microphone" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Start Recording</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#E0E0E0',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  startButton: {
    backgroundColor: '#00B4D8',
  },
  stopButton: {
    backgroundColor: '#FF6F20',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  icon: {
    marginRight: 8,
  },
  loadingContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 100,
    alignItems: 'center',
    backgroundColor: '#112D4E',
    padding: 22,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    color: '#00B4D8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#112D4E',
    color: '#E0E0E0',
    fontSize: 16,
    padding: 10,
    borderRadius: 8,
    borderColor: '#00B4D8',
    borderWidth: 1,
    marginBottom: 12,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    marginBottom: 90,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B4D8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  section: {
    marginBottom: 24,
    padding: 18,
    backgroundColor: '#1B2A41',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#00B4D8',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#00B4D8',
  },
  transcriptText: {
    fontSize: 18,
    color: '#E0E0E0',
    lineHeight: 26,
  },
  itemText: {
    fontSize: 18,
    color: '#E0E0E0',
    marginBottom: 10,
    paddingLeft: 12,
    lineHeight: 24,
  },
  itemSubtext: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 6,
    paddingLeft: 20,
  },
  todoItem: {
    marginBottom: 14,
  },
  label: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 4,
  },
});

