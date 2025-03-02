import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { PieChart, LineChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';

function BudgetToolScreen() {
  // Main state
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  
  // Form states
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date()
  });
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // "overview" or "transactions"

  const windowWidth = Dimensions.get('window').width;

  // Category options and colors
  const categoryOptions = [
    'Groceries', 'Dining', 'Transportation', 'Utilities', 
    'Entertainment', 'Shopping', 'Housing', 'Health', 'Income', 'Miscellaneous'
  ];
  const categoryColors = {
    'Groceries': '#4CAF50',
    'Dining': '#FF9800',
    'Transportation': '#2196F3',
    'Utilities': '#9C27B0',
    'Entertainment': '#F44336',
    'Shopping': '#E91E63',
    'Housing': '#3F51B5',
    'Health': '#00BCD4',
    'Income': '#8BC34A',
    'Miscellaneous': '#607D8B'
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Generate insights when data changes
  useEffect(() => {
    if (!loading) {
      const newInsights = generateInsights();
      setInsights(newInsights);
    }
  }, [transactions, budgets, loading]);

  // Load all data from AsyncStorage
  const loadData = async () => {
    try {
      const storedTransactions = await AsyncStorage.getItem('transactions');
      const storedBudgets = await AsyncStorage.getItem('budgets');
      
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
      
      if (storedBudgets) {
        setBudgets(JSON.parse(storedBudgets));
      }
      
      setLoading(false);
    } catch (e) {
      console.error('Error loading data', e);
      Alert.alert('Error', 'Failed to load data');
      setLoading(false);
    }
  };

  // Save transactions to AsyncStorage
  const saveTransactions = async (newTransactions) => {
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(newTransactions));
    } catch (e) {
      console.error('Error saving transactions', e);
      Alert.alert('Error', 'Failed to save transaction');
    }
  };

  // Save budgets to AsyncStorage
  const saveBudgets = async (newBudgets) => {
    try {
      await AsyncStorage.setItem('budgets', JSON.stringify(newBudgets));
    } catch (e) {
      console.error('Error saving budgets', e);
      Alert.alert('Error', 'Failed to save budget');
    }
  };

  // Add a new transaction
  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount)) {
      Alert.alert('Error', 'Amount must be a number');
      return;
    }

    // Auto-categorize if category is empty
    let category = newTransaction.category;
    if (!category) {
      category = categorizeTransaction(newTransaction.description);
    }

    const transaction = {
      id: Date.now().toString(),
      amount: category === 'Income' ? -Math.abs(amount) : Math.abs(amount), // Negative for income
      description: newTransaction.description,
      category,
      date: newTransaction.date.toISOString()
    };

    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);

    setNewTransaction({
      amount: '',
      description: '',
      category: '',
      date: new Date()
    });
    setShowAddTransaction(false);
  };

  // Add or update a budget
  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(newBudget.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Amount must be a positive number');
      return;
    }

    const updatedBudgets = { ...budgets, [newBudget.category]: amount };
    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);

    setNewBudget({
      category: '',
      amount: ''
    });
    setShowAddBudget(false);
  };

  // Delete a transaction
  const handleDeleteTransaction = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updatedTransactions = transactions.filter(t => t.id !== id);
            setTransactions(updatedTransactions);
            saveTransactions(updatedTransactions);
          }
        }
      ]
    );
  };

  // Delete a budget
  const handleDeleteBudget = (category) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updatedBudgets = { ...budgets };
            delete updatedBudgets[category];
            setBudgets(updatedBudgets);
            saveBudgets(updatedBudgets);
          }
        }
      ]
    );
  };

  // Handle date change for transaction form
  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || newTransaction.date;
    setShowDatePicker(false);
    setNewTransaction({ ...newTransaction, date: currentDate });
  };

  // AI: Auto-categorize transactions based on description
  const categorizeTransaction = (description) => {
    const descLower = description.toLowerCase();
    const categoryKeywords = {
      'Groceries': ['grocery', 'supermarket', 'food'],
      'Dining': ['restaurant', 'cafe', 'coffee', 'takeout'],
      'Transportation': ['gas', 'uber', 'lyft', 'taxi', 'parking', 'bus'],
      'Utilities': ['electric', 'water', 'internet', 'bill'],
      'Entertainment': ['movie', 'netflix', 'spotify', 'concert'],
      'Shopping': ['amazon', 'store', 'mall'],
      'Housing': ['rent', 'mortgage', 'home'],
      'Health': ['doctor', 'medical', 'pharmacy', 'hospital'],
      'Income': ['salary', 'paycheck', 'deposit'],
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (descLower.includes(keyword)) {
          return category;
        }
      }
    }
    return 'Miscellaneous';
  };

  // AI: Generate financial insights
  const generateInsights = () => {
    if (transactions.length < 3) {
      return ["Add more transactions to receive personalized insights."];
    }
    
    const insights = [];
    
    // Top spending category
    const categoryTotals = {};
    transactions.filter(t => t.amount > 0).forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      insights.push(`Your highest spending category is ${topCategory} at $${topAmount.toFixed(2)}.`);
    }
    
    // Budget status insights
    if (Object.keys(budgets).length > 0) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.amount > 0;
      });
      const monthlySpending = {};
      currentTransactions.forEach(t => {
        monthlySpending[t.category] = (monthlySpending[t.category] || 0) + t.amount;
      });
      
      const overBudget = [];
      const atRisk = [];
      for (const [category, budget] of Object.entries(budgets)) {
        const spent = monthlySpending[category] || 0;
        const percent = (spent / budget) * 100;
        if (percent >= 100) {
          overBudget.push(category);
        } else if (percent >= 80) {
          atRisk.push(category);
        }
      }
      if (overBudget.length > 0) {
        insights.push(`Warning: You've exceeded your budget for: ${overBudget.join(', ')}.`);
      }
      if (atRisk.length > 0) {
        insights.push(`You're close to exceeding your budget for: ${atRisk.join(', ')}.`);
      }
    }
    
    // Unusual expenses insight
    const expenses = transactions.filter(t => t.amount > 0).map(t => t.amount);
    if (expenses.length >= 5) {
      const mean = expenses.reduce((a, b) => a + b, 0) / expenses.length;
      const stdDev = Math.sqrt(expenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / expenses.length);
      const threshold = mean + 2 * stdDev;
      const unusual = transactions.filter(t => t.amount > threshold);
      if (unusual.length > 0) {
        insights.push(`You have ${unusual.length} unusually large expense(s) that might need review.`);
      }
    }
    
    // Income vs Expenses
    const totalIncome = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    if (totalIncome > 0 && totalExpenses > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
      if (savingsRate < 0) {
        insights.push(`Warning: You're spending more than your income. Consider reducing expenses.`);
      } else if (savingsRate < 10) {
        insights.push(`Your savings rate is only ${savingsRate.toFixed(1)}%. Consider setting a budget to increase savings.`);
      } else if (savingsRate > 20) {
        insights.push(`Great job! You're saving ${savingsRate.toFixed(1)}% of your income.`);
      }
    }
    
    // Suggest setting budgets if none exist
    if (Object.keys(budgets).length === 0 && transactions.length >= 10) {
      insights.push(`Based on your spending patterns, consider setting up budgets for your top categories.`);
    }
    
    // Forecast next month's expenses
    if (transactions.length >= 10) {
      const prediction = predictNextMonthExpenses();
      if (prediction) {
        insights.push(`I predict your expenses next month will be around $${prediction.toFixed(2)}.`);
      }
    }
    
    return insights;
  };

  // Predict next month's expenses using simple linear regression
  const predictNextMonthExpenses = () => {
    if (transactions.length < 10) return null;
    const monthlyTotals = {};
    transactions.filter(t => t.amount > 0).forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + t.amount;
    });
    const keys = Object.keys(monthlyTotals);
    if (keys.length < 2) return null;
    const amounts = keys.map(key => monthlyTotals[key]);
    const n = amounts.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = amounts.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * amounts[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const prediction = intercept + slope * n;
    return Math.max(0, prediction);
  };

  // Get spending for current month (optionally filtered by category)
  const getCurrentMonthSpending = (category = null) => {
    const now = new Date();
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear() &&
               t.amount > 0 &&
               (category === null || t.category === category);
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Get current month's income
  const getCurrentMonthIncome = () => {
    const now = new Date();
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear() &&
               t.amount < 0;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  // Calculate budget progress percentage for a given category
  const calculateProgress = (category) => {
    const spent = getCurrentMonthSpending(category);
    const budget = budgets[category] || 0;
    return budget === 0 ? 0 : Math.min((spent / budget) * 100, 100);
  };

  // Prepare data for pie chart (spending by category)
  const getPieChartData = () => {
    const categoryTotals = {};
    transactions.filter(t => t.amount > 0).forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    return Object.keys(categoryTotals)
      .filter(category => categoryTotals[category] > 0)
      .map(category => ({
        name: category,
        value: categoryTotals[category],
        color: categoryColors[category] || '#607D8B',
        legendFontColor: '#7F7F7F',
        legendFontSize: 11
      }));
  };

  // Prepare data for line chart (daily spending for last 14 days)
  const getLineChartData = () => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 13);
    const dailyTotals = {};
    for (let i = 0; i < 14; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      dailyTotals[dateStr] = 0;
    }
    transactions.filter(t => {
      const date = new Date(t.date);
      return date >= startDate && t.amount > 0;
    }).forEach(t => {
      const dateStr = t.date.split('T')[0];
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + t.amount;
    });
    const labels = Object.keys(dailyTotals).map(date => date.substr(5, 5));
    const data = Object.values(dailyTotals);
    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  // Render Overview Tab
  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.contentContainer}>
      {/* Financial summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Monthly Expenses</Text>
            <Text style={styles.summaryValue}>${getCurrentMonthSpending().toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Monthly Income</Text>
            <Text style={styles.summaryValue}>${getCurrentMonthIncome().toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Available Balance</Text>
            <Text style={[
              styles.summaryValue, 
              { color: getCurrentMonthIncome() - getCurrentMonthSpending() >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              ${(getCurrentMonthIncome() - getCurrentMonthSpending()).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
      
      {/* AI Insights Preview */}
      {insights.length > 0 && (
        <View style={styles.insightsPreview}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            <TouchableOpacity onPress={() => setShowInsights(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.insightCard}>
            <Ionicons name="bulb-outline" size={24} color="#FFC107" style={styles.insightIcon} />
            <Text style={styles.insightText}>{insights[0]}</Text>
          </View>
          {insights.length > 1 && (
            <TouchableOpacity style={styles.moreInsightsButton} onPress={() => setShowInsights(true)}>
              <Text style={styles.moreInsightsText}>+{insights.length - 1} more insights</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Budgets Overview */}
      <View style={styles.budgetsOverview}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Budgets</Text>
          <TouchableOpacity onPress={() => setShowAddBudget(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>
        {Object.keys(budgets).length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No budgets set yet</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowAddBudget(true)}>
              <Text style={styles.emptyStateButtonText}>Add Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(budgets).slice(0, 3).map(([category, budget]) => {
            const spent = getCurrentMonthSpending(category);
            const progress = calculateProgress(category);
            const remaining = budget - spent;
            return (
              <View key={category} style={styles.budgetProgressCard}>
                <View style={styles.budgetProgressHeader}>
                  <Text style={styles.budgetCategory}>{category}</Text>
                  <Text style={styles.budgetAmount}>
                    ${spent.toFixed(2)} <Text style={styles.budgetLimit}>/ ${budget.toFixed(2)}</Text>
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[
                    styles.progressBar, 
                    { width: `${progress}%`, backgroundColor: progress > 100 ? '#F44336' : progress > 80 ? '#FFC107' : '#4CAF50' }
                  ]} />
                </View>
                <Text style={[
                  styles.remainingText,
                  { color: remaining < 0 ? '#F44336' : '#4CAF50' }
                ]}>
                  {remaining < 0 ? 'Over budget by ' : 'Remaining: '} ${Math.abs(remaining).toFixed(2)}
                </Text>
              </View>
            );
          })
        )}
        {Object.keys(budgets).length > 3 && (
          <TouchableOpacity style={styles.viewAllButton} onPress={() => setActiveTab('budgets')}>
            <Text style={styles.viewAllButtonText}>View All Budgets</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Recent Transactions */}
      <View style={styles.recentTransactions}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => setShowAddTransaction(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>
        {transactions.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowAddTransaction(true)}>
              <Text style={styles.emptyStateButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          transactions.slice(0, 3).map(transaction => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.categoryIcon, 
                  { backgroundColor: categoryColors[transaction.category] || '#607D8B' }
                ]}>
                  <Text style={styles.categoryInitial}>
                    {transaction.category.charAt(0)}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionMeta}>
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.amount < 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {transaction.amount < 0 ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}
        {transactions.length > 3 && (
          <TouchableOpacity style={styles.viewAllButton} onPress={() => setActiveTab('transactions')}>
            <Text style={styles.viewAllButtonText}>View All Transactions</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Charts Section */}
      {transactions.length >= 5 && (
        <View style={styles.chartsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spending Analysis</Text>
          </View>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Spending by Category</Text>
            <PieChart
              data={getPieChartData()}
              width={windowWidth - 40}
              height={200}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Daily Spending (Last 14 Days)</Text>
            <LineChart
              data={getLineChartData()}
              width={windowWidth - 40}
              height={200}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "4", strokeWidth: "2", stroke: "#2196F3" }
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );

  // Render Transactions Tab (full list)
  const renderTransactions = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.contentContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Transactions</Text>
        <TouchableOpacity onPress={() => setShowAddTransaction(true)}>
          <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>
      {transactions.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowAddTransaction(true)}>
            <Text style={styles.emptyStateButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        transactions.map(transaction => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionLeft}>
              <View style={[
                styles.categoryIcon, 
                { backgroundColor: categoryColors[transaction.category] || '#607D8B' }
              ]}>
                <Text style={styles.categoryInitial}>
                  {transaction.category.charAt(0)}
                </Text>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription} numberOfLines={1}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionMeta}>
                  {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDeleteTransaction(transaction.id)}>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.amount < 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {transaction.amount < 0 ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  // Main render: switch between tabs based on activeTab state
  const renderContent = () => {
    if (activeTab === 'overview') {
      return renderOverview();
    } else if (activeTab === 'transactions') {
      return renderTransactions();
    }
    // You can add more tab options here (e.g., for budgets)
    return null;
  };

  // Main UI rendering
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your budget data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderContent()}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Add New', 'Floating action pressed')}>
        <View style={styles.fabButton}>
          <Ionicons name="add" size={24} color="white" />
        </View>
      </TouchableOpacity>

      {/* Notification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <ScrollView style={styles.modalScrollView}>
              {notifications.map(notification => (
                <View key={notification.id} style={styles.notificationItem}>
                  <Text style={styles.notificationText}>{notification.title}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setNotificationModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Budget Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={budgetModalVisible}
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Savings</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="Enter saved amount"
              keyboardType="numeric"
              value={newBudget.amount}
              onChangeText={(text) => setNewBudget({ ...newBudget, amount: text })}
            />
            <TextInput 
              style={styles.modalInput}
              placeholder="Category"
              value={newBudget.category}
              onChangeText={(text) => setNewBudget({ ...newBudget, category: text })}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleAddBudget}>
              <Text style={styles.modalButtonText}>Update Budget</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={() => setShowAddBudget(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ff5f96',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 10,
    zIndex: 100,
    elevation: 3,
  },
  headerContent: { paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  welcomeText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginRight: 16, position: 'relative' },
  notificationBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF8C00', borderRadius: 10, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  profileButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  profileImage: { width: 36, height: 36, borderRadius: 18 },
  searchBarContainer: { marginTop: 10, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 48, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  filterButton: { padding: 8, borderRadius: 8, backgroundColor: '#F5EEF8' },
  scrollContainer: { flex: 1, backgroundColor: '#f8f9fc' },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  tabsContainer: { backgroundColor: 'white', paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabsScrollContent: { paddingHorizontal: 16 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20 },
  activeTabItem: { backgroundColor: '#ff5f96' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#666' },
  activeTabText: { color: 'white', fontWeight: '600' },
  sectionContainer: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  viewAllText: { fontSize: 14, color: '#2196F3' },
  summaryContainer: { marginBottom: 20 },
  summaryCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 16, color: '#666' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  summaryDivider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  insightsPreview: { marginBottom: 20 },
  insightCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  insightIcon: { marginRight: 10 },
  insightText: { flex: 1, fontSize: 14, color: '#333' },
  moreInsightsButton: { marginTop: 10, alignSelf: 'flex-end' },
  moreInsightsText: { fontSize: 14, color: '#2196F3' },
  budgetsOverview: { marginBottom: 20 },
  budgetProgressCard: { backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  budgetProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  budgetCategory: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  budgetAmount: { fontSize: 16, color: '#333' },
  budgetLimit: { fontSize: 14, color: '#999' },
  progressBarContainer: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 5 },
  progressBar: { height: '100%', borderRadius: 3 },
  remainingText: { fontSize: 14 },
  emptyStateContainer: { alignItems: 'center', padding: 20 },
  emptyStateText: { fontSize: 16, color: '#666', marginBottom: 10 },
  emptyStateButton: { backgroundColor: '#2196F3', padding: 10, borderRadius: 8 },
  emptyStateButtonText: { color: 'white', fontWeight: 'bold' },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  categoryInitial: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  transactionDetails: { flex: 1 },
  transactionDescription: { fontSize: 16, color: '#333' },
  transactionMeta: { fontSize: 12, color: '#999' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  chartsSection: { marginBottom: 20 },
  chartCard: { backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  fab: { position: 'absolute', bottom: 20, right: 20 },
  fabButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ff5f96', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalInput: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  modalButton: { backgroundColor: '#ff5f96', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginVertical: 6, width: '100%', alignItems: 'center' },
  modalButtonText: { color: 'white', fontSize: 16 },
  modalCloseButton: { marginTop: 10 },
  modalCloseButtonText: { color: '#ff5f96', fontSize: 16 },
  modalScrollView: { maxHeight: 200, width: '100%', marginVertical: 10 },
  notificationItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%' },
  notificationText: { fontSize: 16, color: '#333' }
});

export default BudgetToolScreen;
