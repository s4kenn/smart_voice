// import React, { useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import axios from 'axios';
// import { Audio } from 'expo-av';

// const App = () => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [transcript, setTranscript] = useState('');
//   const [actions, setActions] = useState(null);
//   const recordingRef = useRef(null);

//   const startRecording = async () => {
//     try {
//       await Audio.requestPermissionsAsync();
//       const recording = new Audio.Recording();
//       await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
//       await recording.startAsync();
//       recordingRef.current = recording;
//       setIsRecording(true);
//     } catch (error) {
//       console.error('Error starting recording:', error);
//     }
//   };

//   const stopRecording = async () => {
//     if (recordingRef.current) {
//       await recordingRef.current.stopAndUnloadAsync();
//       const uri = recordingRef.current.getURI();
//       setIsRecording(false);
//       sendAudioToBackend(uri);
//     }
//   };

//   const sendAudioToBackend = async (uri) => {
//     const formData = new FormData();
//     formData.append('audio', {
//       uri,
//       type: 'audio/mp3',
//       name: 'audio.mp3',
//     });

//     try {
//       const response = await axios.post('http://192.168.120.253:5000/transcribe', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       setTranscript(response.data.transcript);
//       setActions(response.data.actions);
//     } catch (error) {
//       console.error('Error sending audio:', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.heading}>Speech-to-Text Transcriber</Text>
//       <TouchableOpacity style={styles.button} onPress={isRecording ? stopRecording : startRecording}>
//         <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
//       </TouchableOpacity>
//       <Text style={styles.subheading}>Transcript:</Text>
//       <Text>{transcript || 'No transcript available'}</Text>
//       {actions && (
//         <View>
//           <Text style={styles.subheading}>Extracted Actions:</Text>
//           <Text>{JSON.stringify(actions, null, 2)}</Text>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
//   heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
//   subheading: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
//   button: { backgroundColor: 'blue', padding: 10, borderRadius: 5, marginTop: 20 },
//   buttonText: { color: 'white', fontSize: 16 },
// });

// export default App;


// import React, { useState } from 'react';
// import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
// import { Audio } from 'expo-av';
// import axios from 'axios';

// export default function App() {
//   const [recording, setRecording] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [transcript, setTranscript] = useState('');
//   const [processedData, setProcessedData] = useState(null);

//   const startRecording = async () => {
//     try {
//       console.log('Requesting permissions..');
//       const permission = await Audio.requestPermissionsAsync();
//       if (permission.status !== 'granted') {
//         Alert.alert('Permission required', 'Please grant microphone permission');
//         return;
//       }

//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });

//       // Updated recording configuration
//       const { recording } = await Audio.Recording.createAsync({
//         android: {
//           extension: '.mp3',
//           outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
//           audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
//           sampleRate: 44100,
//           numberOfChannels: 2,
//           bitRate: 128000,
//         },
//         ios: {
//           extension: '.m4a',
//           audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
//           sampleRate: 44100,
//           numberOfChannels: 2,
//           bitRate: 128000,
//           linearPCMBitDepth: 16,
//           linearPCMIsBigEndian: false,
//           linearPCMIsFloat: false,
//         },
//         web: {
//           mimeType: 'audio/webm',
//           bitsPerSecond: 128000,
//         }
//       });

//       setRecording(recording);
//       setIsRecording(true);
//       console.log('Recording started');
//     } catch (err) {
//       console.error('Failed to start recording:', err);
//       Alert.alert('Error', 'Failed to start recording: ' + err.message);
//     }
//   };


//   const stopRecording = async () => {
//     try {
//       console.log('Stopping recording..');
//       setIsRecording(false);
//       await recording.stopAndUnloadAsync();
//       const uri = recording.getURI();
//       console.log('Recording stopped and stored at', uri);
//       setRecording(null);
//       await sendAudioToBackend(uri);
//     } catch (err) {
//       console.error('Failed to stop recording:', err);
//       Alert.alert('Error', 'Failed to stop recording');
//     }
//   };

//   const sendAudioToBackend = async (uri) => {
//     try {
//       setIsLoading(true);
//       setTranscript('');
//       setProcessedData(null);

//       const formData = new FormData();
//       formData.append('audio', {
//         uri,
//         name: 'recording.mp3',
//         type: 'audio/mp3',
//       });

//       const response = await axios.post('http://192.168.120.253:3000/transcribe', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         timeout: 300000, // 5 minute timeout
//         maxContentLength: 50 * 1024 * 1024, // 50MB
//         maxBodyLength: 50 * 1024 * 1024 // 50MB
//       });

//       if (response.data.status === 'success') {
//         setTranscript(response.data.transcript);
//         setProcessedData({
//           calendar_event: response.data.calendar_event,
//           todo_items: response.data.todo_items,
//           meeting_summary: response.data.meeting_summary
//         });
//       } else {
//         Alert.alert('Error', response.data.error || 'Processing failed');
//       }
//     } catch (error) {
//       console.error('Error details:', error.response?.data || error.message);
//       Alert.alert('Error', 'Failed to process audio. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   // Render functions remain unchanged
//   const renderCalendarEvent = () => {
//     if (!processedData?.calendar_event) return null;
//     const event = processedData.calendar_event;
//     return (
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Meeting Details:</Text>
//         <Text style={styles.itemText}>Title: {event.title}</Text>
//         <Text style={styles.itemText}>Date: {event.date}</Text>
//         <Text style={styles.itemText}>Time: {event.time}</Text>
//         {event.participants?.length > 0 && (
//           <Text style={styles.itemText}>Participants: {event.participants.join(', ')}</Text>
//         )}
//       </View>
//     );
//   };

//   const renderTodoItems = () => {
//     if (!processedData?.todo_items?.length) return null;
//     return (
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Action Items:</Text>
//         {processedData.todo_items.map((item, index) => (
//           <View key={index} style={styles.todoItem}>
//             <Text style={styles.itemText}>• {item.task}</Text>
//             <Text style={styles.itemSubtext}>Assignee: {item.assignee}</Text>
//             <Text style={styles.itemSubtext}>Deadline: {item.deadline}</Text>
//           </View>
//         ))}
//       </View>
//     );
//   };

//   const renderMeetingSummary = () => {
//     if (!processedData?.meeting_summary) return null;
//     const summary = processedData.meeting_summary;
//     return (
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Meeting Summary:</Text>
//         {summary.key_points?.length > 0 && (
//           <View style={styles.subsection}>
//             <Text style={styles.subsectionTitle}>Key Points:</Text>
//             {summary.key_points.map((point, index) => (
//               <Text key={index} style={styles.itemText}>• {point}</Text>
//             ))}
//           </View>
//         )}
//         {summary.decisions?.length > 0 && (
//           <View style={styles.subsection}>
//             <Text style={styles.subsectionTitle}>Decisions:</Text>
//             {summary.decisions.map((decision, index) => (
//               <Text key={index} style={styles.itemText}>• {decision}</Text>
//             ))}
//           </View>
//         )}
//         {summary.next_steps?.length > 0 && (
//           <View style={styles.subsection}>
//             <Text style={styles.subsectionTitle}>Next Steps:</Text>
//             {summary.next_steps.map((step, index) => (
//               <Text key={index} style={styles.itemText}>• {step}</Text>
//             ))}
//           </View>
//         )}
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Voice-to-Action App</Text>
//       <View style={styles.buttonContainer}>
//         {isRecording ? (
//           <Button title="Stop Recording" onPress={stopRecording} color="red" />
//         ) : (
//           <Button title="Start Recording" onPress={startRecording} color="green" />
//         )}
//       </View>
//       {isLoading && (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#0000ff" />
//           <Text style={styles.loadingText}>Processing your recording...</Text>
//         </View>
//       )}

//       <ScrollView style={styles.contentContainer}>
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Transcript:</Text>
//           <Text style={styles.transcriptText}>{transcript || 'No transcript yet.'}</Text>
//         </View>

//         {renderCalendarEvent()}
//         {renderTodoItems()}
//         {renderMeetingSummary()}
//       </ScrollView>
//     </View>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 20,
//     paddingTop: 50,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     textAlign: 'center',
//     color: '#2c3e50',
//   },
//   buttonContainer: {
//     marginBottom: 20,
//   },
//   loadingContainer: {
//     alignItems: 'center',
//     marginVertical: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     color: '#666',
//     fontSize: 16,
//   },
//   contentContainer: {
//     flex: 1,
//     width: '100%',
//   },
//   section: {
//     marginBottom: 20,
//     padding: 15,
//     backgroundColor: '#f8f9fa',
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   subsection: {
//     marginTop: 10,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     color: '#2c3e50',
//   },
//   subsectionTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 5,
//     color: '#34495e',
//   },
//   transcriptText: {
//     fontSize: 16,
//     color: '#444',
//     lineHeight: 24,
//   },
//   itemText: {
//     fontSize: 16,
//     color: '#444',
//     marginBottom: 8,
//     paddingLeft: 10,
//     lineHeight: 22,
//   },
//   itemSubtext: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 4,
//     paddingLeft: 20,
//   },
//   todoItem: {
//     marginBottom: 12,
//   }
// });




// import React, { useState } from 'react';
// import { View, Text, Button, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
// import { createDrawerNavigator } from '@react-navigation/drawer';
// import { NavigationContainer } from '@react-navigation/native';
// import { Audio } from 'expo-av';

// const Drawer = createDrawerNavigator();

// const HomeScreen = ({ navigation }) => {
//   const [recording, setRecording] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [transcript, setTranscript] = useState('');
//   const [processedData, setProcessedData] = useState(null);

//   const startRecording = async () => {
//     try {
//       const permission = await Audio.requestPermissionsAsync();
//       if (permission.status !== 'granted') {
//         Alert.alert('Permission required', 'Please grant microphone permission');
//         return;
//       }
//       await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
//       const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
//       setRecording(recording);
//       setIsRecording(true);
//     } catch (err) {
//       Alert.alert('Error', 'Failed to start recording');
//     }
//   };

//   const stopRecording = async () => {
//     setIsRecording(false);
//     await recording.stopAndUnloadAsync();
//     const uri = recording.getURI();
//     setRecording(null);
//     setTranscript("Sample transcript from audio");
//   };

//   const renderCalendarEvent = () => {
//     if (!processedData?.calendar_event) return null;
//     return (
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Meeting Details:</Text>
//         <Text style={styles.itemText}>Title: {processedData.calendar_event.title}</Text>
//         <Text style={styles.itemText}>Date: {processedData.calendar_event.date}</Text>
//         <Text style={styles.itemText}>Time: {processedData.calendar_event.time}</Text>
//       </View>
//     );
//   };

//   const renderTodoItems = () => {
//     if (!processedData?.todo_items?.length) return null;
//     return (
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Action Items:</Text>
//         {processedData.todo_items.map((item, index) => (
//           <Text key={index} style={styles.itemText}>• {item.task}</Text>
//         ))}
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Voice-to-Action App</Text>
//       <TouchableOpacity style={styles.button} onPress={isRecording ? stopRecording : startRecording}>
//         <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
//       </TouchableOpacity>
//       {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
//       <ScrollView>
//         <Text style={styles.transcript}>{transcript}</Text>
//         {renderCalendarEvent()}
//         {renderTodoItems()}
//       </ScrollView>
//     </View>
//   );
// };

// const ToDoTasks = () => (
//   <View style={styles.container}>
//     <Text style={styles.title}>To-Do Tasks</Text>
//     <Text>- Complete project report</Text>
//     <Text>- Buy groceries</Text>
//     <Text>- Call the doctor</Text>
//   </View>
// );

// const MeetingSchedule = () => (
//   <View style={styles.container}>
//     <Text style={styles.title}>Meeting Schedule</Text>
//     <Text>- Team meeting at 10 AM</Text>
//     <Text>- Client call at 2 PM</Text>
//     <Text>- Project discussion at 4 PM</Text>
//   </View>
// );

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Drawer.Navigator initialRouteName="Home">
//         <Drawer.Screen name="Home" component={HomeScreen} />
//         <Drawer.Screen name="To-Do Tasks" component={ToDoTasks} />
//         <Drawer.Screen name="Meeting Schedule" component={MeetingSchedule} />
//       </Drawer.Navigator>
//     </NavigationContainer>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
//   button: { backgroundColor: 'blue', padding: 10, borderRadius: 5, marginTop: 20 },
//   buttonText: { color: 'white', fontSize: 16 },
//   transcript: { marginTop: 20, fontSize: 16, textAlign: 'center' },
//   section: { marginBottom: 20, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 10 },
//   sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
//   itemText: { fontSize: 16, color: '#444', marginBottom: 8, paddingLeft: 10 },
// });



// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
// import { createDrawerNavigator } from '@react-navigation/drawer';
// import { NavigationContainer } from '@react-navigation/native';
// import { Audio } from 'expo-av';
// import axios from 'axios';

// const Drawer = createDrawerNavigator();

// const HomeScreen = ({ navigation }) => {
//   const [recording, setRecording] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [transcript, setTranscript] = useState('');
//   const [processedData, setProcessedData] = useState(null);

//   const startRecording = async () => {
//     try {
//       const permission = await Audio.requestPermissionsAsync();
//       if (permission.status !== 'granted') {
//         Alert.alert('Permission required', 'Please grant microphone permission');
//         return;
//       }
//       await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
//       const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
//       setRecording(recording);
//       setIsRecording(true);
//     } catch (err) {
//       Alert.alert('Error', 'Failed to start recording');
//     }
//   };

//   const stopRecording = async () => {
//     setIsRecording(false);
//     await recording.stopAndUnloadAsync();
//     const uri = recording.getURI();
//     setRecording(null);
//     await sendAudioToBackend(uri);
//   };

//   const sendAudioToBackend = async (uri) => {
//     try {
//       setIsLoading(true);
//       setTranscript('');
//       setProcessedData(null);

//       const formData = new FormData();
//       formData.append('audio', {
//         uri,
//         name: 'recording.mp3',
//         type: 'audio/mp3',
//       });

//       const response = await axios.post('http://192.168.120.253:3000/transcribe', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       if (response.data.status === 'success') {
//         setTranscript(response.data.transcript);
//         setProcessedData(response.data);
//       } else {
//         Alert.alert('Error', response.data.error || 'Processing failed');
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to process audio. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const renderCalendarEvent = () => {
//     if (!processedData?.calendar_event) return null;
//     return (
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Meeting Details:</Text>
//         <Text>Title: {processedData.calendar_event.title}</Text>
//         <Text>Date: {processedData.calendar_event.date}</Text>
//         <Text>Time: {processedData.calendar_event.time}</Text>
//       </View>
//     );
//   };

//   const renderTodoItems = () => {
//     if (!processedData?.todo_items?.length) return null;
//     return (
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Action Items:</Text>
//         {processedData.todo_items.map((item, index) => (
//           <Text key={index}>• {item.task}</Text>
//         ))}
//       </View>
//     );
//   };

//   const renderMeetingSummary = () => {
//     if (!processedData?.meeting_summary) return null;
//     const summary = processedData.meeting_summary;
//     return (
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Meeting Summary:</Text>
//         {summary.key_points?.length > 0 && (
//           <View style={styles.subsection}>
//             <Text style={styles.subsectionTitle}>Key Points:</Text>
//             {summary.key_points.map((point, index) => (
//               <Text key={index} style={styles.itemText}>• {point}</Text>
//             ))}
//           </View>
//         )}
//         {summary.decisions?.length > 0 && (
//           <View style={styles.subsection}>
//             <Text style={styles.subsectionTitle}>Decisions:</Text>
//             {summary.decisions.map((decision, index) => (
//               <Text key={index} style={styles.itemText}>• {decision}</Text>
//             ))}
//           </View>
//         )}
//         {summary.next_steps?.length > 0 && (
//           <View style={styles.subsection}>
//             <Text style={styles.subsectionTitle}>Next Steps:</Text>
//             {summary.next_steps.map((step, index) => (
//               <Text key={index} style={styles.itemText}>• {step}</Text>
//             ))}
//           </View>
//         )}
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Voice-to-Action App</Text>
//       <TouchableOpacity style={styles.button} onPress={isRecording ? stopRecording : startRecording}>
//         <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
//       </TouchableOpacity>
//       {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
//       <ScrollView>
//         <Text style={styles.transcript}>{transcript}</Text>
//         {renderCalendarEvent()}
//         {renderTodoItems()}
//         {renderMeetingSummary()}
//       </ScrollView>
//     </View>
//   );
// };

// const ToDoTasks = () => (
//   <View style={styles.container}>
//     <Text style={styles.title}>To-Do Tasks</Text>
//     <Text>- Complete project report</Text>
//     <Text>- Buy groceries</Text>
//   </View>
// );

// const MeetingSchedule = () => (
//   <View style={styles.container}>
//     <Text style={styles.title}>Meeting Schedule</Text>
//     <Text>- Team meeting at 10 AM</Text>
//   </View>
// );

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Drawer.Navigator initialRouteName="Home">
//         <Drawer.Screen name="Home" component={HomeScreen} />
//         <Drawer.Screen name="To-Do Tasks" component={ToDoTasks} />
//         <Drawer.Screen name="Meeting Schedule" component={MeetingSchedule} />
//       </Drawer.Navigator>
//     </NavigationContainer>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   button: {
//     backgroundColor: '#007bff',
//     padding: 10,
//     borderRadius: 5,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   transcript: {
//     fontSize: 16,
//     color: '#333',
//     marginBottom: 10,
//   },
//   section: {
//     backgroundColor: '#f8f9fa',
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
// });

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, ScrollView, Linking, TouchableOpacity } from 'react-native';
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

      const response = await axios.post('http://192.168.120.253:3000/transcribe', formData, {
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


  // Render functions remain unchanged
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

  // const renderTodoItems = () => {
  //   if (!processedData?.todo_items?.length) return null;
  //   return (
  //     <View style={styles.section}>
  //       <Text style={styles.sectionTitle}>Action Items:</Text>
  //       {processedData.todo_items.map((item, index) => (
  //         <View key={index} style={styles.todoItem}>
  //           <Text style={styles.itemText}>• {item.task}</Text>
  //           <Text style={styles.itemSubtext}>Assignee: {item.assignee}</Text>
  //           <Text style={styles.itemSubtext}>Deadline: {item.deadline}</Text>
  //         </View>
  //       ))}
  //     </View>
  //   );
  // };

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





  // const renderMeetingSummary = () => {
  //   if (!processedData?.meeting_summary) return null;
  //   const summary = processedData.meeting_summary;
  //   return (
  //     <View style={styles.section}>
  //       <Text style={styles.sectionTitle}>Meeting Summary:</Text>
  //       {summary.key_points?.length > 0 && (
  //         <View style={styles.subsection}>
  //           <Text style={styles.subsectionTitle}>Key Points:</Text>
  //           {summary.key_points.map((point, index) => (
  //             <Text key={index} style={styles.itemText}>• {point}</Text>
  //           ))}
  //         </View>
  //       )}
  //       {summary.decisions?.length > 0 && (
  //         <View style={styles.subsection}>
  //           <Text style={styles.subsectionTitle}>Decisions:</Text>
  //           {summary.decisions.map((decision, index) => (
  //             <Text key={index} style={styles.itemText}>• {decision}</Text>
  //           ))}
  //         </View>
  //       )}
  //       {summary.next_steps?.length > 0 && (
  //         <View style={styles.subsection}>
  //           <Text style={styles.subsectionTitle}>Next Steps:</Text>
  //           {summary.next_steps.map((step, index) => (
  //             <Text key={index} style={styles.itemText}>• {step}</Text>
  //           ))}
  //         </View>
  //       )}
  //     </View>
  //   );
  // };
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
    backgroundColor: '#0A192F', // Dark Blue Background
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 26, // Increased size
    fontWeight: 'bold',
    marginBottom: 25, // More spacing
    textAlign: 'center',
    color: '#E0E0E0', // Light Gray Text
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
    borderRadius: 30, // Rounded button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  startButton: {
    backgroundColor: '#00B4D8', // Teal color
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
    color: '#00B4D8', // Teal Accent
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1B2A41',
    color: '#E0E0E0',
    fontSize: 16,
    padding: 10,
    borderRadius: 8,
    borderColor: '#00B4D8',
    borderWidth: 1,
    marginBottom: 8,
  },

  contentContainer: {
    flex: 1,
    width: '100%',
    marginBottom: 90, // More spacing for better layout
  },
  emailButton: {
    flexDirection: 'row',  // Places icon and text in one line
    alignItems: 'center',  // Centers them vertically
    justifyContent: 'center', // Centers content inside the button
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
    backgroundColor: '#1B2A41', // Darker Section Color
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20, // Increased size
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#00B4D8', // Teal Accent
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#00B4D8',
  },
  transcriptText: {
    fontSize: 18, // Slightly bigger
    color: '#E0E0E0',
    lineHeight: 26,
  },
  itemText: {
    fontSize: 18, // Increased size
    color: '#E0E0E0',
    marginBottom: 10,
    paddingLeft: 12,
    lineHeight: 24,
  },
  itemSubtext: {
    fontSize: 16,
    color: '#A0A0A0', // Softer gray for subtext
    marginBottom: 6,
    paddingLeft: 20,
  },
  todoItem: {
    marginBottom: 14,
  },
  section: {
    marginBottom: 24,
    padding: 18,
    backgroundColor: '#1B2A41',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#00B4D8',
  },
  todoItem: {
    marginBottom: 14,
  },
  label: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#112D4E',
    color: '#E0E0E0',
    fontSize: 16,
    padding: 10,
    borderRadius: 8,
    borderColor: '#00B4D8',
    borderWidth: 1,
    marginBottom: 12, // More spacing after inputs
  },
});

