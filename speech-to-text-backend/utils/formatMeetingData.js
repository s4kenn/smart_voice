function formatMeetingData(extractedData) {
    return {
        calendar_event: extractedData.meeting?.date
            ? {
                title: "Meeting",
                date: extractedData.meeting.date,
                time: extractedData.meeting.time || "",
                participants: extractedData.meeting.participants || []
            }
            : null,
        todo_items: (extractedData.tasks || []).map((task) => ({
            task: task.task,
            assignee: task.assignee || "Unassigned",
            deadline: task.deadline || "No deadline",
            status: "pending"
        })),
        meeting_summary: {
            key_points: extractedData.key_points || [],
            decisions: extractedData.decisions || [],
            next_steps: extractedData.next_steps || [],
            generated_at: new Date().toISOString()
        }
    };
}

export default formatMeetingData;
