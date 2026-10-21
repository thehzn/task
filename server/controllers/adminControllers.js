
const User = require("../models/userSchema");

const Tasks = require("../models/taskSchema");

exports.getAllUsers = async (req, res) => {
    try {
         

        const  {role } = req.query;
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const skip = (page - 1) * limit;
        const filter = { role: { $ne: "admin" } }; 
        if (role && ["user", "manager"].includes(role)) {
            filter.role = role;
        }
        

        const users = await User.find(filter)
            .select("name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

            console.log(users);

        res.status(200).json({
            success: true,
            totalUsers: users.length,
            users,
        });

    } catch (error) {
        console.error("getAllUsers error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.deleteUser= async(req,res)=>{
    try{
        const {id} = req.params;
        const user = await User.findByIdAndDelete(id);
        if(!user){
             return res.status(404).json({ success: false, message: "user not found" });
        }
         res.json({ success: true, message: "user deleted successfully" });
    } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
}

exports.getAllTaskList = async(req,res)=>{
    try{
          const limit = req.query.limit || 10;
       const page = req.query.page || 1;
       const skip = (page - 1) * limit;

        const tasklist = await Tasks.find()
        .select("title description duedate priority status createdAt")
        .populate("poster","name email")
        .populate("assignedTo","name email")
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit);
        console.log(tasklist);
        res.status(200).json({
            success:true,
            message:"tasks list fetched successfully",
            tasklist
        });
    }
      catch (error) {
        console.error("Task list fetch error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }

}

exports.deleteTask = async(req,res)=>{
     try{
        const {id} = req.params;
        const task = await Tasks.findByIdAndDelete(id);
        if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
     res.json({ success: true, message: "Task deleted successfully" });

     }
     catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
}