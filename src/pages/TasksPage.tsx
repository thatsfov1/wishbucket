import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { getReferralStats } from "../services/supabase-api";
import {
  hapticFeedback,
  showTelegramAlert,
  openTelegramLink,
} from "../utils/telegram";
import {
  TASK_CATEGORIES,
  getTasksByCategory,
  getNextReferralMilestone,
  getCompletedReferralMilestones,
  Task,
  TaskCategory,
} from "../config/tasks";
import BottomNavBar from "../components/BottomNavBar";
import "./TasksPage.css";

interface TaskCompletion {
  [taskId: string]: boolean;
}

export default function TasksPage() {
  const navigate = useNavigate();
  const { userProfile } = useStore();
  const [activeCategory, setActiveCategory] = useState<TaskCategory | "all">(
    "all"
  );
  const [completedTasks, setCompletedTasks] = useState<TaskCompletion>({});
  const [referralCount, setReferralCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const userPoints = userProfile?.bonusPoints || 0;

  useEffect(() => {
    loadData();
    loadCompletedTasks();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const stats = await getReferralStats();
      setReferralCount(stats.totalReferrals);
    } catch (error) {
      console.error("Error loading referral stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompletedTasks = () => {
    const saved = localStorage.getItem("completedTasks");
    if (saved) {
      setCompletedTasks(JSON.parse(saved));
    }
  };

  const saveTaskCompletion = (taskId: string) => {
    const updated = { ...completedTasks, [taskId]: true };
    setCompletedTasks(updated);
    localStorage.setItem("completedTasks", JSON.stringify(updated));
  };

  const handleCategoryChange = (category: TaskCategory | "all") => {
    hapticFeedback.selection();
    setActiveCategory(category);
  };

  const handleTaskClick = (task: Task) => {
    hapticFeedback.impact("light");

    if (completedTasks[task.id] && !task.isRepeatable) {
      showTelegramAlert("✅ You've already completed this task!");
      return;
    }

    if (task.type === "follow_channel" && task.actionUrl) {
      openTelegramLink(task.actionUrl);
      // Mark as completed after opening
      setTimeout(() => {
        saveTaskCompletion(task.id);
        hapticFeedback.notification("success");
        showTelegramAlert(
          `🎉 +${task.pointsReward} points! Thanks for following!`
        );
      }, 2000);
    } else if (task.type === "referral") {
      navigate("/friends");
    } else if (task.type === "social" && task.id === "social_share_app") {
      handleShareApp();
    } else if (task.type === "app_action") {
      handleAppAction(task);
    }
  };

  const handleShareApp = () => {
    openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(
        "https://t.me/wishbucket_bot"
      )}&text=${encodeURIComponent(
        "Check out WishBucket - create and share wishlists with friends! 🎁"
      )}`
    );
    hapticFeedback.notification("success");
  };

  const handleAppAction = (task: Task) => {
    switch (task.id) {
      case "action_create_wishlist":
        navigate("/wishlists");
        break;
      case "action_add_5_items":
        navigate("/wishlists");
        break;
      case "action_share_wishlist":
        navigate("/wishlists");
        break;
      default:
        break;
    }
  };

  const isTaskCompleted = (task: Task): boolean => {
    if (task.type === "referral" && task.targetCount) {
      return referralCount >= task.targetCount;
    }
    return completedTasks[task.id] || false;
  };

  const getTaskProgress = (
    task: Task
  ): { current: number; target: number } | null => {
    if (task.type === "referral" && task.targetCount) {
      return {
        current: Math.min(referralCount, task.targetCount),
        target: task.targetCount,
      };
    }
    return null;
  };

  const renderTask = (task: Task) => {
    const completed = isTaskCompleted(task);
    const progress = getTaskProgress(task);

    return (
      <div
        key={task.id}
        className={`task-item ${completed ? "completed" : ""}`}
        onClick={() => handleTaskClick(task)}
      >
        <div className="task-icon">
          <span>{completed ? "✅" : task.emoji}</span>
        </div>
        <div className="task-content">
          <h4 className="task-title">{task.title}</h4>
          <p className="task-description">{task.description}</p>
          {progress && (
            <div className="task-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(progress.current / progress.target) * 100}%`,
                  }}
                />
              </div>
              <span className="progress-text">
                {progress.current}/{progress.target}
              </span>
            </div>
          )}
        </div>
        <div className="task-reward">
          <span className="reward-icon">💎</span>
          <span className="reward-value">+{task.pointsReward}</span>
        </div>
        {!completed && (
          <div className="task-arrow">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  const getAllTasks = (): Task[] => {
    if (activeCategory === "all") {
      return TASK_CATEGORIES.flatMap((cat) => getTasksByCategory(cat.id));
    }
    return getTasksByCategory(activeCategory);
  };

  const nextMilestone = getNextReferralMilestone(referralCount);
  const completedMilestones = getCompletedReferralMilestones(referralCount);

  return (
    <div className="tasks-container">
      {/* Header */}
      <header className="tasks-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <h1>Earn Points</h1>
        <div className="header-points">
          <span className="points-icon">💎</span>
          <span className="points-value">{userPoints}</span>
        </div>
      </header>

      {/* Points & Progress Banner */}
      <div className="tasks-banner">
        <div className="banner-stats">
          <div className="stat-box">
            <span className="stat-value">{userPoints}</span>
            <span className="stat-label">Points</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-box">
            <span className="stat-value">{referralCount}</span>
            <span className="stat-label">Referrals</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-box">
            <span className="stat-value">{completedMilestones.length}</span>
            <span className="stat-label">Milestones</span>
          </div>
        </div>
        {nextMilestone && (
          <div className="next-milestone">
            <span className="milestone-label">Next: {nextMilestone.label}</span>
            <div className="milestone-progress">
              <div
                className="milestone-fill"
                style={{
                  width: `${(referralCount / nextMilestone.count) * 100}%`,
                }}
              />
            </div>
            <span className="milestone-reward">+{nextMilestone.reward} 💎</span>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="tasks-categories">
        <button
          className={`category-btn ${activeCategory === "all" ? "active" : ""}`}
          onClick={() => handleCategoryChange("all")}
        >
          All Tasks
        </button>
        {TASK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${
              activeCategory === cat.id ? "active" : ""
            }`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="tasks-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading tasks...</p>
          </div>
        ) : activeCategory === "all" ? (
          TASK_CATEGORIES.map((category) => {
            const tasks = getTasksByCategory(category.id);
            if (tasks.length === 0) return null;

            return (
              <div key={category.id} className="category-section">
                <div className="section-header">
                  <span className="section-emoji">{category.emoji}</span>
                  <div className="section-info">
                    <h2>{category.name}</h2>
                    <p>{category.description}</p>
                  </div>
                </div>
                <div className="tasks-list">{tasks.map(renderTask)}</div>
              </div>
            );
          })
        ) : (
          <div className="tasks-list">{getAllTasks().map(renderTask)}</div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="tasks-cta">
        <button className="cta-btn" onClick={() => navigate("/market")}>
          <span>🎁</span>
          <span>Spend Points in Shop</span>
        </button>
      </div>

      <BottomNavBar />
    </div>
  );
}
