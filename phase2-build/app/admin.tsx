import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { useSession } from '../SessionContext';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase.js';
import { router } from 'expo-router';

// broadcast message - in app messaging - firebase
// extra features for registered users+
// reporting page - direct edit and global changes -- linked to global messaging -- in app messaging
// light mode dark mode - maps + screens
// refactoring - coding style and commenting
// add apply to be verified user button in settings
// verified user can add a comment on the event that gets broadcast to subscribers
// move geomapping geo secret out of search hazard
// manager promotion to admin user - can request in settings with an authcode
// include contact us button in settings... with a ticket-log function sort of thing
// add USER type supports in firebase - and user status
// -- 1 should be public user... 2 admin/mod... 3 verified org ... 4 god mode/super user
// -- active - 0 = inactive, 1 = active, 2 = suspended, 3= banned
// add report user.... in event detail
// add subscribe to event in event detail to receive broadcasts
// marker on search page to show searched location
// in the firestore... might just need to check the disabled property for the user too as well as the custom one

// TODO - Add org accounts
// 1. Master user for account is signed in > add individual user accounts or import user account list of existing users ... csv?
// 2. User account being added must be pre-existing
// 3. Process requests for verified account from settings.tsx


const db = getFirestore(app);

const LEVELS = [
  { label: '1 (User)', value: 1 },
  { label: '2 (Moderator)', value: 2 },
  { label: '3 (Admin)', value: 3 },
  { label: '4 (Super Admin)', value: 4 },
];

export default function AdminScreen() {
  const { theme } = useTheme();
  const { session, updateSession, clearSession } = useSession();

  // UI state
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedUid, setSelectedUid] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [eventId, setEventId] = useState('');
  const [popup, setPopup] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Used to prevent blur geocode issue (from earlier Q)
  const [justSelectedSuggestion, setJustSelectedSuggestion] = useState(false);

  // Permission helpers
  const userLevel = session.accountType;
  const isActive = session.active === 1;
  const sessionValid = session.type === 'authenticated' && isActive && 
  (session.expiry ? new Date(session.expiry) > new Date() : false);

  // --- Fetch the open requests queue ---
  const fetchQueue = async () => {
    if (!sessionValid) return;
    const q = query(collection(db, 'request'), where('status', '==', 1));
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({ ...doc.data(), requestId: doc.id }));
    setQueue(requests);
  };

  useEffect(() => { fetchQueue(); }, [sessionValid]);

  // --- Select a user from queue ---
  const handleSelectUser = (item: any) => {
    setSelectedEmail(item.username);
    setSelectedUid(item.UID);
    setSelectedLevel(item.accountType);
  };

  // --- Clear form fields ---
  const clearForm = () => {
    setSelectedEmail('');
    setSelectedUid('');
    setSelectedLevel(undefined);
    setBroadcastMsg('');
    setEventId('');
  };

  // --- Permission checks ---
  const canPromote = (targetLevel: number) => {
    if (userLevel === 4) return true;
    if (userLevel === 3 && targetLevel < 2) return true; // can promote to 2
    return false;
  };
  const canDemote = (targetLevel: number) => {
    if (userLevel === 4) return true;
    if (userLevel === 3 && targetLevel === 2) return true; // can demote 2 to 1
    return false;
  };
  const canSuspend = (targetLevel: number) => userLevel > 1 && userLevel > targetLevel;

  // --- Promote/Demote/Suspend/Password Reset ---
  const handlePromote = async () => {
    if (!sessionValid) return Alert.alert('Session expired', 'Please log in again.');
    if (!selectedUid || selectedLevel === undefined) return;
    if (!canPromote(selectedLevel)) return Alert.alert('Permission Denied', 'You cannot promote this user.');

    Alert.alert('Confirm', `Promote user to level ${selectedLevel + 1}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Promote', onPress: async () => {
          setLoading(true);
          try {
            const userRef = doc(db, 'user', selectedUid);
            await updateDoc(userRef, { accountType: selectedLevel + 1 });
            // If from queue, mark as processed
            if (queue.some(q => q.username === selectedEmail)) {
              const req = queue.find(q => q.username === selectedEmail);
              if (req) await updateDoc(doc(db, 'request', req.requestId), { status: 2, changeDateTime: serverTimestamp() });
            }
            setPopup({ type: 'success', message: 'User promoted successfully.' });
            clearForm();
            fetchQueue();
          } catch (e) {
            setPopup({ type: 'error', message: 'Failed to promote user.' });
          }
          setLoading(false);
        }
      }
    ]);
  };

  const handleDemote = async () => {
    if (!sessionValid) return Alert.alert('Session expired', 'Please log in again.');
    if (!selectedUid || selectedLevel === undefined) return;
    if (!canDemote(selectedLevel)) return Alert.alert('Permission Denied', 'You cannot demote this user.');

    Alert.alert('Confirm', `Demote user to level ${selectedLevel - 1}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Demote', onPress: async () => {
          setLoading(true);
          try {
            const userRef = doc(db, 'user', selectedUid);
            await updateDoc(userRef, { accountType: selectedLevel - 1 });
            // If from queue, mark as processed
            if (queue.some(q => q.username === selectedEmail)) {
              const req = queue.find(q => q.username === selectedEmail);
              if (req) await updateDoc(doc(db, 'request', req.requestId), { status: 2, changeDateTime: serverTimestamp() });
            }
            setPopup({ type: 'success', message: 'User demoted successfully.' });
            clearForm();
            fetchQueue();
          } catch (e) {
            setPopup({ type: 'error', message: 'Failed to demote user.' });
          }
          setLoading(false);
        }
      }
    ]);
  };

  const handleSuspend = async () => {
    if (!sessionValid) return Alert.alert('Session expired', 'Please log in again.');
    if (!selectedUid || selectedLevel === undefined) return;
    if (!canSuspend(selectedLevel)) return Alert.alert('Permission Denied', 'You cannot suspend this user.');

    Alert.alert('Confirm', `Suspend user ${selectedEmail}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Suspend', onPress: async () => {
          setLoading(true);
          try {
            const userRef = doc(db, 'user', selectedUid);
            await updateDoc(userRef, { active: 0 });
            // If from queue, mark as processed
            if (queue.some(q => q.username === selectedEmail)) {
              const req = queue.find(q => q.username === selectedEmail);
              if (req) await updateDoc(doc(db, 'request', req.requestId), { status: 2, changeDateTime: serverTimestamp() });
            }
            setPopup({ type: 'success', message: 'User suspended successfully.' });
            clearForm();
            fetchQueue();
          } catch (e) {
            setPopup({ type: 'error', message: 'Failed to suspend user.' });
          }
          setLoading(false);
        }
      }
    ]);
  };

  const handlePasswordReset = () => {
    // Implement password reset logic as needed (e.g., send reset email)
    Alert.alert('Password Reset', 'Password reset functionality coming soon.');
  };

  // --- Broadcast Message ---
  const handleSendBroadcast = async () => {
    if (!sessionValid) return Alert.alert('Session expired', 'Please log in again.');
    if (!broadcastMsg || !eventId) return setPopup({ type: 'error', message: 'Event ID and message required.' });
    setLoading(true);
    try {
      const msgId = Date.now().toString();
      await setDoc(doc(db, 'broadMsg', msgId), {
        message: broadcastMsg,
        eventId,
        timeStamp: serverTimestamp(),
        messageId: msgId,
        creator: session.uid
      });
      setPopup({ type: 'success', message: 'Broadcast sent.' });
      setBroadcastMsg('');
      setEventId('');
    } catch (e) {
      setPopup({ type: 'error', message: 'Failed to send broadcast.' });
    }
    setLoading(false);
  };

  // --- Back/Exit Button ---
  const handleBack = () => router.back();

  // --- Render ---
  if (!sessionValid) {
    return (
      <View style={[styles.pageContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Access Denied</Text>
        <Text style={{ color: theme.text }}>You do not have permission to view this page.</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
          <Text style={{ color: theme.primary, marginLeft: 8 }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.pageContainer, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Back/Exit Button */}
      <TouchableOpacity onPress={handleBack} style={styles.exitButton}>
        <Ionicons name="arrow-back" size={28} color={theme.primary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.text }]}>Disaster Map</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>User Request Queue</Text>

        {/* User Request Queue */}
        <View style={[styles.queueContainer, { backgroundColor: theme.card }]}>
          {queue.length === 0 ? (
            <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>No open requests.</Text>
          ) : (
            queue.map(item => (
              <View key={item.requestId} style={styles.queueRow}>
                <Text style={{ color: theme.text }}>{item.username} (Level {item.accountType})</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => handleSelectUser(item)}
                >
                  <Text style={styles.buttonText}>Select</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Email Field */}
        <View style={styles.formRow}>
          <Text style={[styles.label, { color: theme.text }]}>Email</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            value={selectedEmail}
            onChangeText={setSelectedEmail}
            placeholder="Enter email"
            placeholderTextColor={theme.textSecondary}
            editable={!loading}
          />
        </View>

        {/* Level Dropdown and Password Reset */}
        <View style={styles.formRow}>
          <Text style={[styles.label, { color: theme.text }]}>Level</Text>
          <View style={styles.levelRow}>
            <TextInput
              style={[styles.inputSmall, { color: theme.text, borderColor: theme.border }]}
              value={selectedLevel ? String(selectedLevel) : ''}
              keyboardType="number-pad"
              onChangeText={txt => setSelectedLevel(Number(txt))}
              placeholder="Level"
              placeholderTextColor={theme.textSecondary}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.button }]}
              onPress={handlePasswordReset}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Password Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promote / Suspend Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: canPromote(selectedLevel ?? 0) ? theme.button : theme.buttonDisabled }
            ]}
            onPress={handlePromote}
            disabled={!canPromote(selectedLevel ?? 0) || loading}
          >
            <Text style={styles.buttonText}>Promote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: canSuspend(selectedLevel ?? 0) ? theme.button : theme.buttonDisabled }
            ]}
            onPress={handleSuspend}
            disabled={!canSuspend(selectedLevel ?? 0) || loading}
          >
            <Text style={styles.buttonText}>Suspend</Text>
          </TouchableOpacity>
        </View>
        {/* Demote Button for level 3/4 */}
        {(userLevel === 3 || userLevel === 4) && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: canDemote(selectedLevel ?? 0) ? theme.button : theme.buttonDisabled }
              ]}
              onPress={handleDemote}
              disabled={!canDemote(selectedLevel ?? 0) || loading}
            >
              <Text style={styles.buttonText}>Demote</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />

        {/* Event Id and Broadcast Message */}
        <View style={styles.formRow}>
          <Text style={[styles.label, { color: theme.text }]}>Event Id</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            value={eventId}
            onChangeText={setEventId}
            placeholder="Enter Event ID"
            placeholderTextColor={theme.textSecondary}
            editable={!loading}
          />
        </View>
        <Text style={[styles.label, { color: theme.text }]}>Broadcast Message</Text>
        <TextInput
          style={[styles.textArea, { color: theme.text, borderColor: theme.border }]}
          value={broadcastMsg}
          onChangeText={setBroadcastMsg}
          placeholder="Type your message here..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: broadcastMsg && eventId ? theme.button : theme.buttonDisabled }
          ]}
          onPress={handleSendBroadcast}
          disabled={!broadcastMsg || !eventId || loading}
        >
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>

        {/* Clear Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.button }]}
          onPress={clearForm}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Popup for Success/Error */}
      {popup && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupText}>{popup.message}</Text>
            <TouchableOpacity
              style={styles.buttonPopupClose}
              onPress={() => setPopup(null)}
            >
              <Text style={styles.popupCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  pageContainer: { flex: 1 },
  contentContainer: { padding: 24, alignItems: 'stretch' },
  exitButton: {
    position: 'absolute',
    top: 25,
    left: 20,
    zIndex: 1,
    padding: 10,
    borderRadius: 10,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  queueContainer: {
    minHeight: 80, maxHeight: 160, marginBottom: 12, borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: '#ccc', justifyContent: 'flex-start'
  },
  queueRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4, borderBottomWidth: 1, borderColor: '#eee'
  },
  selectButton: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#3385FF'
  },
  formRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { width: 60, fontSize: 16, fontWeight: '500' },
  input: {
    flex: 1, height: 40, borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, marginLeft: 8,
    backgroundColor: '#fff'
  },
  inputSmall: {
    width: 60, height: 40, borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, marginRight: 8,
    backgroundColor: '#fff'
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  button: {
    flex: 1, marginHorizontal: 5, paddingVertical: 12, alignItems: 'center',
    borderRadius: 8, marginVertical: 8, backgroundColor: '#3385FF'
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  divider: { borderBottomWidth: 1, borderColor: '#ccc', marginVertical: 16 },
  textArea: {
    borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 8,
    minHeight: 80, marginBottom: 10, backgroundColor: '#fff'
  },
  popupOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10
  },
  popupContainer: {
    backgroundColor: '#fff', borderRadius: 8, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5
  },
  popupText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  buttonPopupClose: { paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#3385FF', borderRadius: 5 },
  popupCloseText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginTop: 24, alignSelf: 'center' },
});

