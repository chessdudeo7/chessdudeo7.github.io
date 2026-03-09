import pandas as pd
from datetime import datetime, timedelta

def generate_schedule(start_date_str, weeks=2):
    slots = []
    current_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    slot_id = 1

    for day in range(weeks * 7):
        # Only Monday (0) through Friday (4)
        if current_date.weekday() < 5: 
            for hour in range(9, 17):
                if hour == 12:
                    continue
                    
                start_time = current_date.replace(hour=hour, minute=0, second=0)
                end_time = start_time + timedelta(hours=1)
                
                slots.append({
                    "slot_id": slot_id,
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat(),
                    "student_name": "", 
                    "subject": ""
                })
                slot_id += 1
        
        current_date += timedelta(days=1)

    df = pd.DataFrame(slots)
    df.to_csv("schedule.csv", index=False)
    print(f"✅ Success! Generated {len(df)} slots in schedule.csv")

# Start from tomorrow
tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
generate_schedule(tomorrow)