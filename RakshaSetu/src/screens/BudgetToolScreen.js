import React, { useState, useEffect } from 'react';
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
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const BudgetToolScreen = () => {
  // State for budget categories and transactions
  const [categories, setCategories] = useState([
    { id: '1', name: 'Housing', budget: 1000, spent: 950, color: '#FF6B6B', icon: 'home' },
    { id: '2', name: 'Groceries', budget: 400, spent: 325, color: '#4ECDC4', icon: 'shopping-basket' },
    { id: '3', name: 'Transportation', budget: 300, spent: 180, color: '#FFD166', icon: 'car' },
    { id: '4', name: 'Healthcare', budget: 200, spent: 75, color: '#6B5CA5', icon: 'heartbeat' },
    { id: '5', name: 'Childcare', budget: 600, spent: 600, color: '#FF9F1C', icon: 'child' },
    { id: '6', name: 'Savings', budget: 300, spent: 300, color: '#2EC4B6', icon: 'piggy-bank' },
  ]);

  const [transactions, setTransactions] = useState([
    { id: '1', description: 'Rent payment', amount: 950, category: '1', date: '2025-03-01' },
    { id: '2', description: 'Weekly groceries', amount: 125, category: '2', date: '2025-03-01' },
    { id: '3', description: 'Gas fill-up', amount: 45, category: '3', date: '2025-02-28' },
    { id: '4', description: 'Pharmacy', amount: 75, category: '4', date: '2025-02-27' },
    { id: '5', description: 'Daycare monthly fee', amount: 600, category: '5', date: '2025-02-27' },
    { id: '6', description: 'Emergency fund', amount: 150, category: '6', date: '2025-02-26' },
    { id: '7', description: 'Retirement contribution', amount: 150, category: '6', date: '2025-02-26' },
    { id: '8', description: 'Groceries top-up', amount: 75, category: '2', date: '2025-02-25' },
    { id: '9', description: 'Bus pass', amount: 85, category: '3', date: '2025-02-24' },
    { id: '10', description: 'Grocery delivery', amount: 125, category: '2', date: '2025-02-22' },
  ]);

  // State for economic insights and goal tracking
  const [insights, setInsights] = useState([
    'Women spend 3x more on healthcare over their lifetime',
    'Setting aside 20% for savings helps close the retirement gap',
    'Childcare costs equal ~40% of single mothers\' income',
    'Negotiating housing costs can save up to 15% annually',
  ]);

  const [goals, setGoals] = useState([
    { id: '1', name: 'Emergency Fund', target: 5000, current: 2500, deadline: '2025-06-01' },
    { id: '2', name: 'Pay off credit card', target: 3000, current: 1000, deadline: '2025-08-01' },
    { id: '3', name: 'Professional development', target: 1200, current: 400, deadline: '2025-10-01' },
  ]);

  // UI state
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('budget');
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: '',
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);

  // Calculate total budget and spent amounts
  const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

  // Add a new transaction
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

    // Create a new transaction
    const transaction = {
      id: Date.now().toString(),
      description: newTransaction.description,
      amount: amount,
      category: selectedCategoryId,
      date: new Date().toISOString().split('T')[0],
    };

    // Update transactions
    setTransactions([transaction, ...transactions]);

    // Update category spent amount
    setCategories(
      categories.map((cat) => {
        if (cat.id === selectedCategoryId) {
          return { ...cat, spent: cat.spent + amount };
        }
        return cat;
      })
    );

    // Reset form and close modal
    setNewTransaction({ description: '', amount: '', category: '' });
    setSelectedCategoryId(null);
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate percentage for progress bars
  const calculatePercentage = (spent, budget) => {
    return Math.min((spent / budget) * 100, 100);
  };

  // Get category by ID
  const getCategoryById = (id) => {
    return categories.find((cat) => cat.id === id) || {};
  };

  // Screen width for layout calculations
  const screenWidth = Dimensions.get('window').width;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#8A2BE2', '#4B0082']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Her Financial Dashboard</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Budget</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalBudget)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: remainingBudget >= 0 ? '#2EC4B6' : '#FF6B6B' }]}>
                Remaining
              </Text>
              <Text style={[styles.summaryValue, { color: remainingBudget >= 0 ? '#2EC4B6' : '#FF6B6B' }]}>
                {formatCurrency(remainingBudget)}
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
          <FontAwesome5 name="coins" size={16} color={activeTab === 'budget' ? '#8A2BE2' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'budget' && styles.activeTabText]}>Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'insights' && styles.activeTabButton]}
          onPress={() => setActiveTab('insights')}
        >
          <FontAwesome5 name="lightbulb" size={16} color={activeTab === 'insights' ? '#8A2BE2' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>Insights</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'goals' && styles.activeTabButton]}
          onPress={() => setActiveTab('goals')}
        >
          <FontAwesome5 name="flag" size={16} color={activeTab === 'goals' ? '#8A2BE2' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>Goals</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'budget' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
            </View>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <View key={category.id} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <FontAwesome5 name={category.icon} size={16} color="#FFF" />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${calculatePercentage(category.spent, category.budget)}%`,
                          backgroundColor: category.spent > category.budget ? '#FF6B6B' : category.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setModalVisible(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <MaterialIcons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {transactions.slice(0, 5).map((transaction) => {
              const category = getCategoryById(transaction.category);
              return (
                <View key={transaction.id} style={styles.transactionItem}>
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
                    <Text style={styles.transactionAmount}>
                      {formatCurrency(transaction.amount)}
                    </Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                  </View>
                </View>
              );
            })}

            {transactions.length > 5 && (
              <TouchableOpacity style={styles.viewAllButton}>
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
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightCard}>
                  <View style={styles.insightIconContainer}>
                    <FontAwesome5 name="lightbulb" size={18} color="#8A2BE2" />
                  </View>
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Top 3 Expenses</Text>
              {categories
                .sort((a, b) => b.spent - a.spent)
                .slice(0, 3)
                .map((category) => (
                  <View key={category.id} style={styles.breakdownItem}>
                    <View style={styles.breakdownLeft}>
                      <View style={[styles.breakdownDot, { backgroundColor: category.color }]} />
                      <Text style={styles.breakdownLabel}>{category.name}</Text>
                    </View>
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(category.spent)} ({Math.round((category.spent / totalSpent) * 100)}%)
                    </Text>
                  </View>
                ))}
              
              <View style={styles.divider} />
              <View style={styles.breakdownStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round((categories.find(c => c.name === 'Savings')?.spent || 0) / totalSpent * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Savings Rate</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round((categories.find(c => c.name === 'Housing')?.spent || 0) / totalSpent * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Housing %</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round((categories.find(c => c.name === 'Childcare')?.spent || 0) / totalSpent * 100)}%
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
                  setEditingGoalId('new');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <MaterialIcons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {goals.map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditingGoalId(goal.id)}
                  >
                    <FontAwesome5 name="edit" size={14} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.goalProgressContainer}>
                  <View
                    style={[
                      styles.goalProgressBar,
                      { width: `${(goal.current / goal.target) * 100}%` }
                    ]}
                  />
                </View>
                
                <View style={styles.goalDetails}>
                  <Text style={styles.goalProgress}>
                    {formatCurrency(goal.current)} of {formatCurrency(goal.target)}
                  </Text>
                  <Text style={styles.goalDeadline}>
                    Due by {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
            </View>

            <View style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <FontAwesome5 name="star" size={16} color="#FFD700" />
                <Text style={styles.recommendationTitle}>Boost Your Savings</Text>
              </View>
              <Text style={styles.recommendationText}>
                You could save an extra $125 this month by reducing spending in Groceries and Transportation categories.
              </Text>
              <TouchableOpacity style={styles.recommendationButton}>
                <Text style={styles.recommendationButtonText}>See How</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <FontAwesome5 name="shield-alt" size={16} color="#4ECDC4" />
                <Text style={styles.recommendationTitle}>Protect Your Future</Text>
              </View>
              <Text style={styles.recommendationText}>
                Women typically need to save 20% more for retirement. Consider increasing your monthly retirement contribution.
              </Text>
              <TouchableOpacity style={styles.recommendationButton}>
                <Text style={styles.recommendationButtonText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add Transaction Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
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

            <TouchableOpacity
              style={styles.addTransactionButton}
              onPress={addTransaction}
            >
              <Text style={styles.addTransactionButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
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
  activeTabButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  activeTabText: {
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#8A2BE2',
    borderRadius: 20,
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
    height: 32,
    width: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#EAEAEA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
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
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    height: 28,
    width: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  transactionCategory: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  viewAllButton: {
    alignItems: 'center',
    padding: 12,
    marginTop: 5,
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 14,
    color: '#8A2BE2',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
  insightsContainer: {
    marginBottom: 20,
  },
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
  insightIconContainer: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
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
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#333',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 15,
  },
  breakdownStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8A2BE2',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  // Goal styles
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 5,
  },
  goalProgressContainer: {
    height: 8,
    backgroundColor: '#EAEAEA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  goalProgressBar: {
    height: '100%',
    backgroundColor: '#8A2BE2',
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgress: {
    fontSize: 14,
    color: '#333',
  },
  goalDeadline: {
    fontSize: 12,
    color: '#666',
  },
  // Recommendation styles
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
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  recommendationButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recommendationButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Modal and form styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryOptionIcon: {
    height: 24,
    width: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#333',
  },
  addTransactionButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  addTransactionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BudgetToolScreen;