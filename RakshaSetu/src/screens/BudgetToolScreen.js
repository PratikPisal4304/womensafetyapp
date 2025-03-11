import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const themeColor = '#ff5f96';

// Utility Functions
const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const calculatePercentage = (spent, budget) =>
  Math.min((spent / budget) * 100, 100);

// Category Card Component with inline budget editing
const CategoryCard = ({ category, onUpdateBudget, computedSpent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBudget, setEditedBudget] = useState(category.budget.toString());

  const handleSave = () => {
    const newBudget = parseFloat(editedBudget);
    if (!isNaN(newBudget) && newBudget > 0) {
      onUpdateBudget(category.id, newBudget);
      setIsEditing(false);
    }
  };

  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <FontAwesome5 name={category.icon} size={16} color="#FFF" />
        </View>
        <Text style={styles.categoryName}>{category.name}</Text>
        {isEditing ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.editInput, { borderColor: category.color }]}
              value={editedBudget}
              onChangeText={setEditedBudget}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
              <FontAwesome5 name="check" size={16} color="#2EC4B6" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.categoryAmount}>
              {formatCurrency(computedSpent)} / {formatCurrency(category.budget)}
            </Text>
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconButton}>
              <FontAwesome5 name="edit" size={16} color={themeColor} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${calculatePercentage(computedSpent, category.budget)}%`,
              backgroundColor:
                computedSpent > category.budget ? '#FF6B6B' : category.color,
            },
          ]}
        />
      </View>
    </View>
  );
};

// Transaction Item Component with Edit/Delete buttons
const TransactionItem = ({ transaction, category, onEdit, onDelete }) => (
  <View style={styles.transactionItem}>
    <View style={styles.transactionLeft}>
      <View style={[styles.transactionIcon, { backgroundColor: category.color }]}>
        <FontAwesome5 name={category.icon} size={14} color="#FFF" />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{transaction.description}</Text>
        <Text style={styles.transactionCategory}>{category.name}</Text>
      </View>
    </View>
    <View style={styles.transactionRight}>
      <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
      <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <TouchableOpacity onPress={() => onEdit(transaction)}>
          <Ionicons name="create-outline" size={16} color={themeColor} style={{ marginRight: 8 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(transaction.id)}>
          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// Insight Card Component
const InsightCard = ({ insight }) => (
  <View style={styles.insightCard}>
    <View style={styles.insightIconContainer}>
      <FontAwesome5 name="lightbulb" size={18} color={themeColor} />
    </View>
    <Text style={styles.insightText}>{insight}</Text>
  </View>
);

// Goal Card Component with inline editing functionality and delete option
const GoalCard = ({ goal, onUpdateGoal, onDeleteGoal }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCurrent, setEditedCurrent] = useState(goal.current.toString());
  const [editedTarget, setEditedTarget] = useState(goal.target.toString());

  const handleSave = () => {
    const newCurrent = parseFloat(editedCurrent);
    const newTarget = parseFloat(editedTarget);
    if (!isNaN(newCurrent) && newCurrent >= 0 && !isNaN(newTarget) && newTarget > 0) {
      onUpdateGoal(goal.id, newCurrent, newTarget);
      setIsEditing(false);
    }
  };

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalName}>{goal.name}</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
            <FontAwesome5 name={isEditing ? 'check' : 'edit'} size={16} color={isEditing ? '#2EC4B6' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDeleteGoal(goal.id)}>
            <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
      {isEditing ? (
        <View style={styles.goalEditContainer}>
          <View style={styles.goalEditField}>
            <Text style={styles.goalEditLabel}>Current:</Text>
            <TextInput
              style={styles.goalEditInput}
              value={editedCurrent}
              onChangeText={setEditedCurrent}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.goalEditField}>
            <Text style={styles.goalEditLabel}>Target:</Text>
            <TextInput
              style={styles.goalEditInput}
              value={editedTarget}
              onChangeText={setEditedTarget}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.goalSaveButton}>
            <Text style={styles.goalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.goalProgressContainer}>
            <View style={[styles.goalProgressBar, { width: `${(goal.current / goal.target) * 100}%` }]} />
          </View>
          <View style={styles.goalDetails}>
            <Text style={styles.goalProgress}>
              {formatCurrency(goal.current)} of {formatCurrency(goal.target)}
            </Text>
            <Text style={styles.goalDeadline}>
              Due by {new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ title, text, buttonText, onPress }) => (
  <View style={styles.recommendationCard}>
    <View style={styles.recommendationHeader}>
      <FontAwesome5 name="star" size={16} color="#FFD700" />
      <Text style={styles.recommendationTitle}>{title}</Text>
    </View>
    <Text style={styles.recommendationText}>{text}</Text>
    <TouchableOpacity style={styles.recommendationButton} onPress={onPress}>
      <Text style={styles.recommendationButtonText}>{buttonText}</Text>
    </TouchableOpacity>
  </View>
);

// Transaction Modal Component with KeyboardAvoidingView (supports both add and edit modes)
const TransactionModal = ({
  visible,
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  categories,
  newTransaction,
  setNewTransaction,
  selectedCategoryId,
  setSelectedCategoryId,
  editingTransaction,
}) => {
  const isEditMode = editingTransaction !== null;

  const handleSave = () => {
    if (isEditMode) {
      onUpdateTransaction({
        ...editingTransaction,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        category: selectedCategoryId,
        date: new Date().toISOString().split('T')[0],
      });
    } else {
      onAddTransaction();
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? 'Edit Transaction' : 'Add Transaction'}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What did you spend on?"
                value={newTransaction.description}
                onChangeText={(text) => setNewTransaction({ ...newTransaction, description: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={newTransaction.amount}
                onChangeText={(text) => setNewTransaction({ ...newTransaction, amount: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categorySelector}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategoryId === category.id && { borderColor: category.color, borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                  >
                    <View style={[styles.categoryOptionIcon, { backgroundColor: category.color }]}>
                      <FontAwesome5 name={category.icon} size={14} color="#FFF" />
                    </View>
                    <Text style={styles.categoryOptionText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.addTransactionButton} onPress={handleSave}>
              <Text style={styles.addTransactionButtonText}>
                {isEditMode ? 'Update Transaction' : 'Add Transaction'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Goal Modal Component for adding new financial goals
const GoalModal = ({ visible, onClose, onAddGoal }) => {
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  const resetFields = () => {
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('');
    setGoalDeadline('');
  };

  const handleAddGoal = () => {
    if (!goalName.trim() || !goalTarget.trim() || !goalDeadline.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const target = parseFloat(goalTarget);
    const current = parseFloat(goalCurrent) || 0;
    if (isNaN(target) || target <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const newGoal = {
      id: Date.now().toString(),
      name: goalName,
      target,
      current,
      deadline: goalDeadline,
    };
    onAddGoal(newGoal);
    resetFields();
    onClose();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Financial Goal</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => { resetFields(); onClose(); }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="E.g., Emergency Fund"
                value={goalName}
                onChangeText={setGoalName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter target amount"
                keyboardType="numeric"
                value={goalTarget}
                onChangeText={setGoalTarget}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Progress</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter current amount"
                keyboardType="numeric"
                value={goalCurrent}
                onChangeText={setGoalCurrent}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deadline (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2025-12-31"
                value={goalDeadline}
                onChangeText={setGoalDeadline}
              />
            </View>
            <TouchableOpacity style={styles.addTransactionButton} onPress={handleAddGoal}>
              <Text style={styles.addTransactionButtonText}>Add Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Main BudgetToolScreen Component with AsyncStorage integration and monthly filtering
const BudgetToolScreen = () => {
  // Data States
  const [categories, setCategories] = useState([
    { id: '1', name: 'Housing', budget: 30000, color: '#FF6B6B', icon: 'home' },
    { id: '2', name: 'Groceries', budget: 10000, color: '#4ECDC4', icon: 'shopping-basket' },
    { id: '3', name: 'Transport', budget: 5000, color: '#FFD166', icon: 'car' },
    { id: '4', name: 'Healthcare', budget: 4000, color: '#6B5CA5', icon: 'heartbeat' },
    { id: '5', name: 'Childcare', budget: 8000, color: '#FF9F1C', icon: 'child' },
    { id: '6', name: 'Savings', budget: 10000, color: '#2EC4B6', icon: 'piggy-bank' },
  ]);

  const [transactions, setTransactions] = useState([
    { id: '1', description: 'Rent payment', amount: 28000, category: '1', date: '2025-03-01' },
    { id: '2', description: 'Weekly groceries', amount: 2500, category: '2', date: '2025-03-01' },
    { id: '3', description: 'Auto-rickshaw fare', amount: 300, category: '3', date: '2025-02-28' },
    { id: '4', description: 'Medical check-up', amount: 3200, category: '4', date: '2025-02-27' },
    { id: '5', description: 'Daycare fee', amount: 8000, category: '5', date: '2025-02-27' },
    { id: '6', description: 'Monthly SIP', amount: 5000, category: '6', date: '2025-02-26' },
    { id: '7', description: 'Bonus investment', amount: 5000, category: '6', date: '2025-02-26' },
    { id: '8', description: 'Extra groceries', amount: 2000, category: '2', date: '2025-02-25' },
    { id: '9', description: 'Bus pass', amount: 500, category: '3', date: '2025-02-24' },
    { id: '10', description: 'Online grocery order', amount: 2500, category: '2', date: '2025-02-22' },
  ]);

  const [insights] = useState([
    'Women in India benefit from SIPs and mutual funds for long-term growth.',
    'Utilize government schemes like Pradhan Mantri Jan Dhan Yojana for financial inclusion.',
    'Consider investing in Sukanya Samriddhi Yojana for your daughter’s future.',
    'Negotiating rent or property rates can save up to 10-15% annually.',
  ]);

  const [goals, setGoals] = useState([
    { id: '1', name: 'Emergency Fund', target: 150000, current: 75000, deadline: '2025-06-01' },
    { id: '2', name: 'Debt Clearance', target: 100000, current: 30000, deadline: '2025-08-01' },
    { id: '3', name: 'Career Development', target: 50000, current: 20000, deadline: '2025-10-01' },
  ]);

  // UI States
  const [modalVisible, setModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('budget');
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', category: '' });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [allTransactionsVisible, setAllTransactionsVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Month & Year filter states
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedTransactions = await AsyncStorage.getItem('@transactions');
        const storedCategories = await AsyncStorage.getItem('@categories');
        const storedGoals = await AsyncStorage.getItem('@goals');
        if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
        if (storedCategories) setCategories(JSON.parse(storedCategories));
        if (storedGoals) setGoals(JSON.parse(storedGoals));
      } catch (error) {
        console.error('Error loading data', error);
      }
    };
    loadData();
  }, []);

  // Reload categories when the screen gains focus
  useFocusEffect(
    useCallback(() => {
      const loadCategoriesFocus = async () => {
        try {
          const storedCategories = await AsyncStorage.getItem('@categories');
          if (storedCategories) setCategories(JSON.parse(storedCategories));
        } catch (error) {
          console.error('Error loading categories on focus', error);
        }
      };
      loadCategoriesFocus();
    }, [])
  );

  // Save transactions to AsyncStorage
  useEffect(() => {
    const saveTransactions = async () => {
      try {
        await AsyncStorage.setItem('@transactions', JSON.stringify(transactions));
      } catch (error) {
        console.error('Error saving transactions', error);
      }
    };
    saveTransactions();
  }, [transactions]);

  // Save categories to AsyncStorage
  useEffect(() => {
    const saveCategories = async () => {
      try {
        await AsyncStorage.setItem('@categories', JSON.stringify(categories));
      } catch (error) {
        console.error('Error saving categories', error);
      }
    };
    saveCategories();
  }, [categories]);

  // Save goals to AsyncStorage
  useEffect(() => {
    const saveGoals = async () => {
      try {
        await AsyncStorage.setItem('@goals', JSON.stringify(goals));
      } catch (error) {
        console.error('Error saving goals', error);
      }
    };
    saveGoals();
  }, [goals]);

  // Filter transactions for the selected month and year
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const d = new Date(txn.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Compute category spending based on filtered transactions only
  const computedCategoriesFiltered = useMemo(() => {
    return categories.map((cat) => {
      const spent = filteredTransactions
        .filter((txn) => txn.category === cat.id)
        .reduce((sum, txn) => sum + txn.amount, 0);
      return { ...cat, spent };
    });
  }, [categories, filteredTransactions]);

  // Helper: Get category by id from computedCategoriesFiltered
  const getCategoryById = (id) =>
    computedCategoriesFiltered.find((cat) => cat.id === id) || {};

  // Monthly totals
  const monthlyBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
  const monthlySpent = filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const monthlyRemaining = monthlyBudget - monthlySpent;

  // PieChart data based on filtered transactions
  const pieData = useMemo(() => {
    return categories
      .map((cat) => {
        const monthlySpentForCat = filteredTransactions
          .filter((txn) => txn.category === cat.id)
          .reduce((sum, txn) => sum + txn.amount, 0);
        return {
          name: cat.name,
          amount: monthlySpentForCat,
          color: cat.color,
          legendFontColor: '#333',
          legendFontSize: 12,
        };
      })
      .filter((item) => item.amount > 0);
  }, [categories, filteredTransactions]);

  // Function to add a new transaction
  const addTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount || !selectedCategoryId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const transaction = {
      id: Date.now().toString(),
      description: newTransaction.description,
      amount: amount,
      category: selectedCategoryId,
      date: new Date().toISOString().split('T')[0],
    };
    setTransactions([transaction, ...transactions]);
    setNewTransaction({ description: '', amount: '', category: '' });
    setSelectedCategoryId(null);
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Function to update a transaction
  const updateTransaction = (updatedTxn) => {
    setTransactions(
      transactions.map((txn) => (txn.id === updatedTxn.id ? updatedTxn : txn))
    );
    setEditingTransaction(null);
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Function to delete a transaction
  const deleteTransaction = (txnId) => {
    setTransactions(transactions.filter((txn) => txn.id !== txnId));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Function to delete a financial goal
  const deleteGoal = (goalId) => {
    setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Month navigation names
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Function to update a goal's progress
  const updateGoal = (goalId, newCurrent, newTarget) => {
    setGoals(
      goals.map((goal) =>
        goal.id === goalId ? { ...goal, current: newCurrent, target: newTarget } : goal
      )
    );
  };

  // Function to add a new goal
  const addGoal = (newGoal) => {
    setGoals([newGoal, ...goals]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[themeColor, themeColor]} style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mahila Arthik Dashboard</Text>
          {/* Monthly summary header (filtered data) */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Budget</Text>
              <Text style={styles.summaryValue}>{formatCurrency(monthlyBudget)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={styles.summaryValue}>{formatCurrency(monthlySpent)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: monthlyRemaining >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                Remaining
              </Text>
              <Text style={[styles.summaryValue, { color: monthlyRemaining >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                {formatCurrency(monthlyRemaining)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'budget' && styles.activeTabButton]}
          onPress={() => setActiveTab('budget')}
        >
          <FontAwesome5 name="coins" size={16} color={activeTab === 'budget' ? themeColor : '#666'} />
          <Text style={[styles.tabText, activeTab === 'budget' && styles.activeTabText]}>Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'insights' && styles.activeTabButton]}
          onPress={() => setActiveTab('insights')}
        >
          <FontAwesome5 name="lightbulb" size={16} color={activeTab === 'insights' ? themeColor : '#666'} />
          <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>Insights</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'goals' && styles.activeTabButton]}
          onPress={() => setActiveTab('goals')}
        >
          <FontAwesome5 name="flag" size={16} color={activeTab === 'goals' ? themeColor : '#666'} />
          <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>Goals</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'budget' && (
          <>
            {/* Month Filter Section */}
            <View style={styles.monthFilterContainer}>
              <TouchableOpacity onPress={() => setSelectedYear(selectedYear - 1)}>
                <Ionicons name="chevron-back-outline" size={24} color={themeColor} />
              </TouchableOpacity>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
                {monthNames.map((m, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.monthButton, selectedMonth === index && styles.activeMonthButton]}
                    onPress={() => setSelectedMonth(index)}
                  >
                    <Text style={[styles.monthText, selectedMonth === index && styles.activeMonthText]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => setSelectedYear(selectedYear + 1)}>
                <Ionicons name="chevron-forward-outline" size={24} color={themeColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthlySummaryContainer}>
              <Text style={styles.monthlySummaryTitle}>
                {monthNames[selectedMonth]} {selectedYear} Summary
              </Text>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Budget</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(monthlyBudget)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Spent</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(monthlySpent)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: monthlyRemaining >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                    Remaining
                  </Text>
                  <Text style={[styles.summaryValue, { color: monthlyRemaining >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                    {formatCurrency(monthlyRemaining)}
                  </Text>
                </View>
              </View>
              <View style={styles.chartContainer}>
                <PieChart
                  data={pieData}
                  width={Dimensions.get('window').width - 80}
                  height={200}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
            </View>
            <View style={styles.categoriesContainer}>
              {computedCategoriesFiltered.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  computedSpent={cat.spent}
                  onUpdateBudget={async (id, newBudget) => {
                    setCategories((prevCategories) => {
                      const updatedCategories = prevCategories.map((cat) =>
                        cat.id === id ? { ...cat, budget: newBudget } : cat
                      );
                      AsyncStorage.setItem('@categories', JSON.stringify(updatedCategories))
                        .catch((error) => console.error("Error saving updated categories", error));
                      return updatedCategories;
                    });
                  }}
                />
              ))}
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setNewTransaction({ description: '', amount: '', category: '' });
                  setSelectedCategoryId(null);
                  setEditingTransaction(null);
                  setModalVisible(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <MaterialIcons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            {filteredTransactions.slice(0, 5).map((txn) => (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                category={getCategoryById(txn.category)}
                onEdit={(txn) => {
                  setEditingTransaction(txn);
                  setNewTransaction({
                    description: txn.description,
                    amount: txn.amount.toString(),
                    category: txn.category,
                  });
                  setSelectedCategoryId(txn.category);
                  setModalVisible(true);
                }}
                onDelete={deleteTransaction}
              />
            ))}
            {filteredTransactions.length > 5 && (
              <TouchableOpacity style={styles.viewAllButton} onPress={() => setAllTransactionsVisible(true)}>
                <Text style={styles.viewAllText}>View all transactions</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {activeTab === 'insights' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Women's Financial Insights</Text>
            </View>
            <View style={styles.insightsContainer}>
              {insights.map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))}
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
            </View>
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Top 3 Expenses</Text>
              {computedCategoriesFiltered
                .sort((a, b) => b.spent - a.spent)
                .slice(0, 3)
                .map((cat) => (
                  <View key={cat.id} style={styles.breakdownItem}>
                    <View style={styles.breakdownLeft}>
                      <View style={[styles.breakdownDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.breakdownLabel}>{cat.name}</Text>
                    </View>
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(cat.spent)} ({Math.round((cat.spent / monthlySpent) * 100)}%)
                    </Text>
                  </View>
                ))}
              <View style={styles.divider} />
              <View style={styles.breakdownStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round((computedCategoriesFiltered.find(c => c.name === 'Savings')?.spent || 0) / monthlySpent * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Savings Rate</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round((computedCategoriesFiltered.find(c => c.name === 'Housing')?.spent || 0) / monthlySpent * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Housing %</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round((computedCategoriesFiltered.find(c => c.name === 'Childcare')?.spent || 0) / monthlySpent * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Childcare %</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'goals' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financial Goals</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setGoalModalVisible(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <MaterialIcons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdateGoal={updateGoal}
                onDeleteGoal={deleteGoal}
              />
            ))}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
            </View>
            <RecommendationCard
              title="Boost Your Savings"
              text="Consider cutting down on discretionary spending and invest in SIPs for steady growth."
              buttonText="See How"
              onPress={() => {}}
            />
            <RecommendationCard
              title="Secure Your Future"
              text="Explore government schemes like Pradhan Mantri Jan Dhan Yojana to strengthen your financial security."
              buttonText="Learn More"
              onPress={() => {}}
            />
          </>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TransactionModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingTransaction(null);
        }}
        onAddTransaction={addTransaction}
        onUpdateTransaction={updateTransaction}
        categories={categories}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        editingTransaction={editingTransaction}
      />

      <GoalModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onAddGoal={addGoal}
      />

      {/* Modal for viewing all transactions */}
      <Modal
        animationType="slide"
        transparent
        visible={allTransactionsVisible}
        onRequestClose={() => setAllTransactionsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Transactions</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setAllTransactionsVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }}>
              {filteredTransactions.map((txn) => (
                <TransactionItem
                  key={txn.id}
                  transaction={txn}
                  category={getCategoryById(txn.category)}
                  onEdit={(txn) => {
                    setEditingTransaction(txn);
                    setNewTransaction({
                      description: txn.description,
                      amount: txn.amount.toString(),
                      category: txn.category,
                    });
                    setSelectedCategoryId(txn.category);
                    setModalVisible(true);
                  }}
                  onDelete={deleteTransaction}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: { paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 15,
    justifyContent: 'space-between',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 5 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  monthFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 10,
  },
  monthScroll: { flexDirection: 'row', alignItems: 'center' },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#EAEAEA',
  },
  activeMonthButton: { backgroundColor: '#ff5f96' },
  monthText: { color: '#333' },
  activeMonthText: { color: '#FFF', fontWeight: 'bold' },
  monthlySummaryContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthlySummaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  chartContainer: { marginTop: 10, alignItems: 'center' },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTabButton: { backgroundColor: 'rgba(255,95,150,0.1)' },
  tabText: { fontSize: 14, color: '#666', marginLeft: 5 },
  activeTabText: { color: '#ff5f96', fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addButton: {
    backgroundColor: '#ff5f96',
    borderRadius: 20,
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff5f96',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesContainer: { marginBottom: 10 },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryIcon: { height: 32, width: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  categoryName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  categoryAmount: { fontSize: 14, color: '#666' },
  editInput: { borderBottomWidth: 1, width: 80, textAlign: 'right', marginRight: 5, fontSize: 14, color: '#333' },
  iconButton: { padding: 4 },
  progressBarContainer: { height: 8, backgroundColor: '#EAEAEA', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionIcon: { height: 28, width: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  transactionDetails: { flex: 1 },
  transactionDescription: { fontSize: 15, fontWeight: '500', color: '#333' },
  transactionCategory: { fontSize: 13, color: '#666', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 15, fontWeight: '600', color: '#333' },
  transactionDate: { fontSize: 12, color: '#999', marginTop: 2 },
  viewAllButton: { alignItems: 'center', padding: 12, marginTop: 5, marginBottom: 20 },
  viewAllText: { fontSize: 14, color: '#ff5f96', fontWeight: '600' },
  bottomSpacer: { height: 40 },
  insightsContainer: { marginBottom: 20 },
  insightCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  insightIconContainer: { height: 36, width: 36, borderRadius: 18, backgroundColor: 'rgba(255,95,150,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  insightText: { flex: 1, fontSize: 14, lineHeight: 20, color: '#333' },
  breakdownCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  breakdownTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  breakdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center' },
  breakdownDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  breakdownLabel: { fontSize: 14, color: '#333' },
  breakdownValue: { fontSize: 14, fontWeight: '500', color: '#333' },
  divider: { height: 1, backgroundColor: '#EAEAEA', marginVertical: 15 },
  breakdownStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#ff5f96', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#666' },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  goalName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  editButton: { padding: 5 },
  deleteButton: { padding: 5, marginLeft: 10 },
  goalProgressContainer: { height: 8, backgroundColor: '#EAEAEA', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  goalProgressBar: { height: '100%', backgroundColor: '#ff5f96' },
  goalDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalProgress: { fontSize: 14, color: '#333' },
  goalDeadline: { fontSize: 12, color: '#666' },
  goalEditContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  goalEditField: { flexDirection: 'row', alignItems: 'center' },
  goalEditLabel: { fontSize: 14, color: '#333', marginRight: 5 },
  goalEditInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 4, padding: 5, fontSize: 14, width: 80, textAlign: 'center' },
  goalSaveButton: { backgroundColor: '#ff5f96', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
  goalSaveText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  recommendationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recommendationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  recommendationTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  recommendationText: { fontSize: 14, color: '#333', marginBottom: 10 },
  recommendationButton: { backgroundColor: '#ff5f96', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
  recommendationButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', borderRadius: 12, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeButton: { padding: 5 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  textInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, padding: 10, fontSize: 16 },
  categorySelector: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 6, padding: 8, marginRight: 8, marginBottom: 8 },
  categoryOptionIcon: { height: 24, width: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  categoryOptionText: { fontSize: 14, color: '#333' },
  addTransactionButton: { backgroundColor: '#ff5f96', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  addTransactionButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bottomSpacer: { height: 40 },
});

export default BudgetToolScreen;
