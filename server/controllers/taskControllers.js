
const User = require("../models/userSchema");
const Tasks = require("../models/taskSchema");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');


exports.createTaskbyUser = async(req,res)=>{
    try{
        const {title,description,duedate,priority,status} =req.body;
        const user = await User.findOne({_id:req.userId});
        if(!user){
           return res.status(404).json({
            success:false,
            message:"User not found"

        });
        }

        const newtask= await Tasks.create({
           poster:req.userId,
           title,
           description,
           duedate,
           priority,
           status,
           assignedTo:req.userId

        });
         res.status(201).json({ success: true,message:"Task created successfully", newtask});    
    }
    catch(error){
 res.status(500).json({ success: false, message: error.message });
    }

}
exports.createTaskbymanager = async(req,res)=>{
    try{
        const {title,description,duedate,priority,status,assignedTo} =req.body;

        const user = await User.findOne({_id:req.userId});
        if(!user){
           return res.status(404).json({
            success:false,
            message:"User not found"

        });
        }

        const newtask= await Tasks.create({
           poster:req.userId,
           title,
           description,
           duedate,
           priority,
           assignedTo,
           status

        });
         res.status(201).json({ success: true,message:"Task created and assigned to user successfully", newtask});    
    }
    catch(error){
 res.status(500).json({ success: false, message: error.message });
    }

}

exports.getAllforUser=async(req,res)=>{
    try{
       const user = await User.findOne({assignedTo:req.userId});
       const limit = req.query.limit || 10;
       const page = req.query.page || 1;
       const skip = (page - 1) * limit;
        if(!user){
           return res.status(404).json({
            success:false,
            message:"user not found"

        });
        } 
         const tasks = await Tasks.find()
         .populate("poster","name email")
       .sort({createdAt:-1})
       .skip(skip)
       .limit(limit);

       res.status(200).json({
        success:true,
        message:"tasks fetched successfully",
        count:tasks.length,
        data:tasks,
       });

    }
    catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

}
exports.getAllformanager=async(req,res)=>{
    try{
         const limit = req.query.limit || 10;
       const page = req.query.page || 1;
       const skip = (page - 1) * limit;
       const user = await User.findOne({poster:req.userId});
        if(!user){
           return res.status(404).json({
            success:false,
            message:"user not found"

        });
        } 
         const tasks = await Tasks.find()
         .populate("poster","name email")
         .populate("assignedTo","name email")
       .sort({createdAt:-1})
       .skip(skip)
       .limit(limit);

       res.status(200).json({
        success:true,
        message:"tasks fetched successfully",
        count:tasks.length,
        data:tasks,
       });

    }
    catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

}



exports.getTask = async(req,res)=>{
    try{

   
     const {id}= req.params;
     const task = await Tasks.findById(id)
     .populate("poster", "name email")
     .populate("assignedTo", "name email");
      if(!task){
           return res.status(404).json({
                success:false,
                message:"task not found"
            });

        }
        if((task.poster.toString() !== req.userId) || (task.assignedTo.toString() !== req.userId)){
            return res.status(403)
            .json({ success: false, message: "Not authorized to access this task" });
        };

       
        return res.status(200).json({
          success:true,
          message:"Details fetched successfully",
          task,
        });
         }
      catch(error){
return res.status(500).json({ message: "Server error", error: error.message });
    }
}


exports.updateTaskbymanager = async(req,res)=>{
    try{
        
        const {id}= req.params;
     const task = await Tasks.findById(id);
      if(!task){
           return res.status(404).json({
                success:false,
                message:"task not found"
            });

        }

        if(task.poster.toString() !== req.userId){
            return res.status(403)
            .json({ success: false, message: "Not authorized to access this task" });
        }
        const {title,description,duedate,priority,status} = req.body;
        const updates = {};
        if(title) updates.title = title;
        if(description) updates.description = description;
         if(duedate) updates.duedate = duedate;
         if(priority) updates.priority = priority;
         if(status) updates.status = status;

     const updatedTask = await Tasks.findByIdAndUpdate(
        id,
        {$set:updates},
        {new:true,runValidators:true}
     );
     return res.status(200).json({
        success:true,
        message:"task updated successfully",
        task:updatedTask,
     })
    }
     catch(error){
return res.status(500).json({ message: "Server error", error: error.message });
    }
}
exports.updateTaskbyUser = async(req,res)=>{
    try{
        const {id}= req.params;
     const task = await Tasks.findById(id);
        if(!task){
              return res.status(404).json({
                success:false,
                message:"task not found"
            });
        }
        if(task.assignedTo.toString() !== req.userId){
            return res.status(403)
            .json({ success: false, message: "Not authorized to access this task" });
        }
        const {status} = req.body;
        const statuses = ["pending", "in progress", "completed"];
        if (!statuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }
        const updates = {}; 
    
         if(status) updates.status = status;

     const updatedTask = await Tasks.findByIdAndUpdate(
        id,
        {$set:updates},
        {new:true,runValidators:true}
     );
     return res.status(200).json({
        success:true,
        message:"task updated successfully",
        task:updatedTask,
     })
    }
     catch(error){
return res.status(500).json({ message: "Server error", error: error.message });
    }
}
exports.deleteTask = async(req,res)=>{
     try{
        const {id} = req.params;
        const task = await Tasks.findById(id);
        if(!task){
            return res.status(404).json({
                success:false,
                message:"task not found"
            });
        }
        if(task.poster.toString() !== req.userId){
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this task"
            });
        }
        await task.deleteOne();
        return res.status(200).json({
            success: true,
            message: "task deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}