// This is a simple mock database service
// In a real application, this would connect to a real database

class DatabaseService {
  constructor() {
    // Initialize with some mock data
    this.tasks = []
    this.facilities = []
    this.staff = []

    // Load data from localStorage if available
    this.loadData()
  }

  loadData() {
    try {
      const tasks = localStorage.getItem("fms_tasks")
      const facilities = localStorage.getItem("fms_facilities")
      const staff = localStorage.getItem("fms_staff")

      if (tasks) this.tasks = JSON.parse(tasks)
      if (facilities) this.facilities = JSON.parse(facilities)
      if (staff) this.staff = JSON.parse(staff)
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
    }
  }

  saveData() {
    try {
      localStorage.setItem("fms_tasks", JSON.stringify(this.tasks))
      localStorage.setItem("fms_facilities", JSON.stringify(this.facilities))
      localStorage.setItem("fms_staff", JSON.stringify(this.staff))
    } catch (error) {
      console.error("Error saving data to localStorage:", error)
    }
  }

  // Task methods
  async getTasks() {
    return [...this.tasks]
  }

  async getTaskById(id) {
    return this.tasks.find((task) => task.id === id)
  }

  async addTask(task) {
    const newTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    this.tasks.push(newTask)
    this.saveData()
    return newTask
  }

  async updateTask(id, updates) {
    const index = this.tasks.findIndex((task) => task.id === id)
    if (index === -1) return null

    const updatedTask = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.tasks[index] = updatedTask
    this.saveData()
    return updatedTask
  }

  async deleteTask(id) {
    const index = this.tasks.findIndex((task) => task.id === id)
    if (index === -1) return false

    this.tasks.splice(index, 1)
    this.saveData()
    return true
  }

  // Facility methods
  async getFacilities() {
    return [...this.facilities]
  }

  async addFacility(facility) {
    const newFacility = {
      ...facility,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    this.facilities.push(newFacility)
    this.saveData()
    return newFacility
  }

  // Staff methods
  async getStaff() {
    return [...this.staff]
  }

  async addStaffMember(staffMember) {
    const newStaffMember = {
      ...staffMember,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    this.staff.push(newStaffMember)
    this.saveData()
    return newStaffMember
  }
}

// Create a singleton instance
const databaseService = new DatabaseService()

export default databaseService

