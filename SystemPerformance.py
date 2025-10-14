# System Performance Monitor - All-in-One Edition
# A professional, discreet productivity tool for system optimization
# Self-contained single file with no external dependencies except pytz

import tkinter as tk
from tkinter import messagebox
import tkinter.ttk as ttk
import subprocess
import os
import threading
import time
import json
from datetime import datetime, timedelta
import pytz
import ctypes
from ctypes import wintypes, windll
import tempfile
import sys
import random

class SystemOptimizer:
    """Built-in cursor and input optimization modules"""
   
    @staticmethod
    def create_cursor_optimizer():
        """Create cursor optimization module as temporary file"""
        cursor_code = '''import ctypes
from ctypes import wintypes
import time
import sys

class POINT(ctypes.Structure):
    _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]

def optimize_cursor():
    """Optimize cursor responsiveness"""
    user32 = ctypes.windll.user32
    cursor_pos = POINT()
   
    while True:
        try:
            # Get current position
            user32.GetCursorPos(ctypes.byref(cursor_pos))
            original_x, original_y = cursor_pos.x, cursor_pos.y
           
            # Minimal optimization adjustment (1 pixel)
            user32.SetCursorPos(original_x + 1, original_y)
            time.sleep(0.01)
            user32.SetCursorPos(original_x, original_y)
           
            print(f"Cursor optimized at ({original_x}, {original_y})")
            time.sleep(30)  # 30-second intervals
           
        except Exception as e:
            print(f"Cursor optimization error: {e}")
            time.sleep(5)
        except KeyboardInterrupt:
            print("Cursor optimization stopped")
            break

if __name__ == "__main__":
    optimize_cursor()
'''
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False)
        temp_file.write(cursor_code)
        temp_file.close()
        return temp_file.name

    @staticmethod
    def create_input_optimizer():
        """Create input optimization module as temporary file"""
        input_code = '''import ctypes
import time
import sys
import os

# Virtual key codes for optimization
VK_CODES = {
    'Shift': 0x10,
    'Ctrl': 0x11,
    'Alt': 0x12,
    'F15': 0x7E,
    'F13': 0x7C,
    'F14': 0x7D
}

def get_optimization_inputs():
    """Get optimization inputs from config or use defaults"""
    default_inputs = ['F15', 'F14']  # Use function keys that don't interfere
   
    try:
        if os.path.exists("keypress_keys.txt"):
            with open("keypress_keys.txt", "r") as f:
                content = f.read().strip()
                if content:
                    inputs = [k.strip() for k in content.split(",") if k.strip()]
                    return inputs if inputs else default_inputs
    except:
        pass
   
    return default_inputs

def send_input_optimization(vk_code):
    """Send optimization input"""
    try:
        # Press key
        ctypes.windll.user32.keybd_event(vk_code, 0, 0, 0)
        time.sleep(0.01)
        # Release key  
        ctypes.windll.user32.keybd_event(vk_code, 0, 2, 0)
    except Exception as e:
        print(f"Input optimization error: {e}")

def optimize_input():
    """Optimize input responsiveness"""
    inputs = get_optimization_inputs()
   
    while True:
        try:
            for input_name in inputs:
                if input_name in VK_CODES:
                    vk_code = VK_CODES[input_name]
                    send_input_optimization(vk_code)
                    print(f"Input optimized: {input_name}")
                    time.sleep(0.1)
           
            time.sleep(150)  # 2.5-minute intervals
           
        except Exception as e:
            print(f"Input optimization error: {e}")
            time.sleep(5)
        except KeyboardInterrupt:
            print("Input optimization stopped")
            break

if __name__ == "__main__":
    optimize_input()
'''
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False)
        temp_file.write(input_code)
        temp_file.close()
        return temp_file.name

class SystemPerformanceMonitor:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("System Performance Monitor")
        self.root.geometry("400x280")
        self.root.resizable(True, True)
       
        # Make window more discreet
        self.root.attributes('-topmost', False)
        self.root.iconify()  # Start minimized
        self.root.after(1000, self.root.deiconify)  # Show after 1 second
       
        # Application state
        self.processes = {}
        self.output_texts = {}
        self.user_active = False
        self.last_user_activity = time.time()
        self.last_mouse_pos = None
        self.activity_counter = 0
        self.manual_paused = False
        self.auto_mode = True
        self.last_notification = ""
        self.manual_run_var = tk.BooleanVar(value=False)
        self.clock_var = tk.StringVar(value="--:--:-- --")
        self.current_status_message = ""
        self.log_entries = []
        self.log_frame = None
        self.grace_stop_time = None
        self.grace_schedule_date = None
        self.grace_stop_triggered = False
       
        # Create temporary module files
        self.cursor_module = SystemOptimizer.create_cursor_optimizer()
        self.input_module = SystemOptimizer.create_input_optimizer()
       
        # Load settings
        self.settings = self.load_settings()
       
        # Create GUI (compact version)
        self.setup_compact_gui()
        self.setup_activity_monitoring()

        # Start auto management
        self.auto_manage_scripts()
       
        # Auto-minimize after startup
        self.root.after(3000, self.auto_minimize)
       
        # Bind window state changes and hotkeys
        self.root.bind('<Unmap>', self.on_window_minimize)
        self.root.bind('<Map>', self.on_window_restore)
        self.root.bind('<Control-h>', lambda e: self.root.iconify())  # Ctrl+H to hide
        self.root.bind('<F12>', lambda e: self.toggle_window_visibility())  # F12 to toggle

    def load_settings(self):
        """Load settings from config file or use defaults"""
        default_settings = {
            "timezone": "US/Eastern",
            "work_start_hour": 9,
            "work_start_minute": 0,
            "work_end_hour": 17,
            "work_end_minute": 0,
            "idle_timeout": 3,
            "auto_resume_delay": 8,
            "always_on_during_hours": True,
            "aggressive_detection": True,
            "auto_start": True,
            "keys_to_press": ["F15", "F16", "Scroll_Lock"],
            "stealth_mode": True,
            "notifications": False,
            "debug_mode": False,
            "show_activity_log": True
        }
       
        try:
            if os.path.exists("activity_settings.json"):
                with open("activity_settings.json", "r") as f:
                    settings = json.load(f)
                    # Merge with defaults for new settings
                    for key, value in default_settings.items():
                        if key not in settings:
                            settings[key] = value
                    return settings
        except Exception:
            pass
        return default_settings
   
    def save_settings(self):
        """Save current settings to config file"""
        try:
            with open("activity_settings.json", "w") as f:
                json.dump(self.settings, f, indent=2)
        except Exception as e:
            if self.settings.get("debug_mode", False):
                self.show_notification(f"Error saving settings: {e}", "error")

    def auto_minimize(self):
        """Auto-minimize window after startup"""
        if self.settings.get("stealth_mode", True):
            # In stealth mode, minimize more aggressively
            self.root.iconify()
        elif self.auto_mode and self.is_within_work_hours():
            self.root.iconify()
   
    def on_window_minimize(self, event=None):
        """Handle window minimize event"""
        # Window is minimized, make it even more discreet
        pass
   
    def on_window_restore(self, event=None):
        """Handle window restore event"""
        # Window is restored
        pass
   
    def toggle_window_visibility(self):
        """Toggle window between minimized and restored"""
        if self.root.state() == 'iconic':
            self.root.deiconify()
            self.root.lift()
            self.root.focus_force()
        else:
            self.root.iconify()
   
    def setup_compact_gui(self):
        """Setup a compact, discreet GUI interface"""
        # Create menu bar
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
       
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Tools", menu=file_menu)
        file_menu.add_command(label="Preferences", command=self.show_settings)
        file_menu.add_command(label="Minimize", command=self.root.iconify)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.on_close)
       
        # Main frame with compact padding
        main_frame = ttk.Frame(self.root, padding="5")
        main_frame.grid(row=0, column=0, sticky="nsew")
       
        # Status variables
        self.status_vars = {
            'mouse': tk.StringVar(value='STOPPED'),
            'key': tk.StringVar(value='STOPPED'),
            'overall': tk.StringVar(value='INIT')
        }

        # Compact title
        title_label = ttk.Label(main_frame, text="System Monitor",
                               font=("Arial", 12, "bold"))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 8))

        # Status display - single line
        status_frame = ttk.Frame(main_frame)
        status_frame.grid(row=1, column=0, columnspan=3, sticky="ew", pady=(0, 8))
        status_frame.grid_columnconfigure(1, weight=1)

        ttk.Label(status_frame, text="Status:", font=("Arial", 9, "bold")).grid(row=0, column=0, sticky=tk.W)
        status_label = ttk.Label(status_frame, textvariable=self.status_vars['overall'],
                                font=("Arial", 10, "bold"), foreground="dark red")
        status_label.grid(row=0, column=1, sticky=tk.W, padx=(5, 0))

        clock_label = ttk.Label(status_frame, textvariable=self.clock_var,
                                font=("Arial", 9, "bold"), foreground="navy")
        clock_label.grid(row=0, column=2, sticky=tk.E, padx=(10, 5))

        # Auto mode toggle - compact
        self.auto_mode_var = tk.BooleanVar(value=self.auto_mode)
        auto_check = ttk.Checkbutton(status_frame, text="Auto",
                                   variable=self.auto_mode_var,
                                   command=self.toggle_auto_mode)
        auto_check.grid(row=0, column=3, padx=(5, 0))

        manual_check = ttk.Checkbutton(status_frame, text="Manual Run",
                                      variable=self.manual_run_var,
                                      command=self.toggle_manual_run)
        manual_check.grid(row=0, column=4, padx=(5, 0))

        # Compact control buttons
        control_frame = ttk.Frame(main_frame)
        control_frame.grid(row=2, column=0, columnspan=3, pady=(0, 8))

        ttk.Button(control_frame, text="Start", width=8,
                  command=self.start_all_modules).grid(row=0, column=0, padx=2)
        ttk.Button(control_frame, text="Pause", width=8,
                  command=self.pause_all_modules).grid(row=0, column=1, padx=2)
        ttk.Button(control_frame, text="Stop", width=8,
                  command=self.stop_all_modules).grid(row=0, column=2, padx=2)
       
        # Module status - very compact
        modules_frame = ttk.LabelFrame(main_frame, text="Modules", padding="3")
        modules_frame.grid(row=3, column=0, columnspan=3, sticky="ew", pady=(0, 8))
       
        # Cursor module
        ttk.Label(modules_frame, text="Cursor:", font=("Arial", 8, "bold")).grid(row=0, column=0, sticky=tk.W)
        ttk.Label(modules_frame, textvariable=self.status_vars['mouse'],
                 font=("Arial", 8, "bold"), foreground="dark green").grid(row=0, column=1, padx=(5, 15), sticky=tk.W)

        # Input module
        ttk.Label(modules_frame, text="Input:", font=("Arial", 8, "bold")).grid(row=0, column=2, sticky=tk.W)
        ttk.Label(modules_frame, textvariable=self.status_vars['key'],
                 font=("Arial", 8, "bold"), foreground="dark green").grid(row=0, column=3, padx=(5, 0), sticky=tk.W)

        # Quick access buttons - minimal
        quick_frame = ttk.Frame(main_frame)
        quick_frame.grid(row=4, column=0, columnspan=3, pady=(0, 5))

        ttk.Button(quick_frame, text="Settings", width=10,
                  command=self.show_settings).grid(row=0, column=0, padx=2)
        ttk.Button(quick_frame, text="Hide", width=10,
                  command=self.root.iconify).grid(row=0, column=1, padx=2)
        ttk.Button(quick_frame, text="About", width=10,
                  command=self.show_about).grid(row=0, column=2, padx=2)

        # Activity log
        self.log_frame = ttk.LabelFrame(main_frame, text="Activity Log", padding="3")
        self.log_frame.grid(row=5, column=0, columnspan=3, sticky="nsew")
        self.log_frame.grid_rowconfigure(0, weight=1)
        self.log_frame.grid_columnconfigure(0, weight=1)

        scrollbar = ttk.Scrollbar(self.log_frame)
        scrollbar.grid(row=0, column=1, sticky='ns')

        self.log_text = tk.Text(self.log_frame, height=6, width=40, state='disabled',
                                font=("Consolas", 8))
        self.log_text.grid(row=0, column=0, sticky='nsew')
        self.log_text.configure(yscrollcommand=scrollbar.set)
        scrollbar.configure(command=self.log_text.yview)

        self.log_event("Monitor initialized")

        # Configure grid weights for responsive design
        self.root.grid_rowconfigure(0, weight=1)
        self.root.grid_columnconfigure(0, weight=1)
        main_frame.grid_columnconfigure(1, weight=1)

        self.apply_log_visibility()
   
    def setup_activity_monitoring(self):
        """Setup enhanced user activity monitoring"""
        def on_user_activity(event=None):
            self.last_user_activity = time.time()
            self.activity_counter += 1
           
            # More sensitive detection
            if self.settings.get("aggressive_detection", True):
                if event and hasattr(event, 'type'):
                    # Different weights for different activities
                    if event.type == '2':  # KeyPress
                        self.activity_counter += 3  # Typing is strong activity signal
                    elif event.type == '6':  # Motion
                        self.activity_counter += 1  # Mouse movement is moderate
                    elif event.type == '4':  # ButtonPress
                        self.activity_counter += 2  # Clicking is strong signal
           
            if not self.manual_paused and self.auto_mode:
                self.update_status("User Active")
                # Force pause modules when user is active
                self.pause_for_activity()
       
        # Bind to all possible user inputs
        self.root.bind_all('<Key>', on_user_activity)
        self.root.bind_all('<KeyPress>', on_user_activity)
        self.root.bind_all('<KeyRelease>', on_user_activity)
        self.root.bind_all('<Motion>', on_user_activity)
        self.root.bind_all('<Button>', on_user_activity)
        self.root.bind_all('<ButtonPress>', on_user_activity)
        self.root.bind_all('<ButtonRelease>', on_user_activity)
       
        # Start enhanced activity detection thread
        self.start_enhanced_detection()
   
    def start_enhanced_detection(self):
        """Start enhanced activity detection using Windows API"""
        def monitor_system_activity():
            try:
                import ctypes
                from ctypes import wintypes
               
                class LASTINPUTINFO(ctypes.Structure):
                    _fields_ = [
                        ('cbSize', wintypes.UINT),
                        ('dwTime', wintypes.DWORD),
                    ]
               
                def get_idle_time():
                    lastInputInfo = LASTINPUTINFO()
                    lastInputInfo.cbSize = ctypes.sizeof(lastInputInfo)
                    ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lastInputInfo))
                    millis = ctypes.windll.kernel32.GetTickCount() - lastInputInfo.dwTime
                    return millis / 1000.0
               
                while True:
                    try:
                        idle_time = get_idle_time()
                        if idle_time < 2:  # Active within last 2 seconds
                            self.last_user_activity = time.time()
                            if self.is_within_work_hours() and not self.manual_paused:
                                self.pause_for_activity()
                        time.sleep(1)  # Check every second
                    except:
                        time.sleep(5)  # Fallback to longer interval on error
                       
            except Exception:
                # Fallback to basic detection if Windows API fails
                pass
       
        # Run in background thread
        thread = threading.Thread(target=monitor_system_activity, daemon=True)
        thread.start()
   
    def pause_for_activity(self):
        """Temporarily pause modules when user is active"""
        if self.is_within_work_hours() and not self.manual_paused:
            # Only pause if modules are running and user is active
            running = any(proc.poll() is None for proc in self.processes.values())
            if running and not self.user_active:
                for name in list(self.processes.keys()):
                    self.stop_module(name)
                self.user_active = True
   
    def get_timezone(self):
        try:
            return pytz.timezone(self.settings.get("timezone", "US/Eastern"))
        except Exception:
            return pytz.timezone("US/Eastern")

    def get_local_now(self):
        tz = self.get_timezone()
        return datetime.now(tz)

    def get_work_schedule(self, now=None):
        if now is None:
            now = self.get_local_now()

        start = now.replace(
            hour=self.settings.get("work_start_hour", 9),
            minute=self.settings.get("work_start_minute", 0),
            second=0,
            microsecond=0,
        )
        end = now.replace(
            hour=self.settings.get("work_end_hour", 17),
            minute=self.settings.get("work_end_minute", 0),
            second=0,
            microsecond=0,
        )

        if end <= start:
            end += timedelta(days=1)

        return start, end

    def is_within_work_hours(self, now=None):
        """Check if current time is within scheduled hours"""
        try:
            if now is None:
                now = self.get_local_now()

            if now.weekday() >= 5:
                return False

            start, end = self.get_work_schedule(now)
            return start <= now <= end

        except Exception:
            return True

    def is_within_grace_period(self, now=None):
        try:
            if now is None:
                now = self.get_local_now()
            if now.weekday() >= 5:
                return False
            _, end = self.get_work_schedule(now)
            grace_end = end + timedelta(minutes=15)
            return end < now <= grace_end
        except Exception:
            return False
   
    def update_status(self, message):
        """Update the overall status display with a 12-hour timestamp"""
        now = self.get_local_now()
        time_str = now.strftime('%I:%M:%S %p')
        uppercase = message.upper()
        if uppercase != self.current_status_message:
            self.log_event(uppercase)
            self.current_status_message = uppercase
        self.status_vars['overall'].set(f"{uppercase} @ {time_str}")

    def log_event(self, message):
        """Record activity in the live log and console"""
        timestamp = self.get_local_now().strftime('%I:%M:%S %p')
        entry = f"[{timestamp}] {message}"
        print(entry)
        self.log_entries.append(entry)
        if len(self.log_entries) > 200:
            self.log_entries = self.log_entries[-200:]

        if hasattr(self, 'log_text'):
            self.log_text.configure(state='normal')
            self.log_text.delete('1.0', 'end')
            self.log_text.insert('end', "\n".join(self.log_entries) + "\n")
            self.log_text.configure(state='disabled')
            self.log_text.see('end')
   
    def show_notification(self, message, msg_type="info"):
        """Show notification if enabled in settings (more discreet)"""
        if not self.settings.get("notifications", False):
            return
        if message == self.last_notification:
            return  # Avoid duplicate notifications
        self.last_notification = message

        # Only show critical errors, suppress info messages for discretion
        if msg_type == "error":
            messagebox.showerror("System Error", message)
        elif msg_type == "warning":
            messagebox.showwarning("System Warning", message)
        # Skip info messages for better discretion

    def apply_log_visibility(self):
        """Show or hide the activity log based on settings"""
        if not hasattr(self, 'log_frame') or self.log_frame is None:
            return

        if self.settings.get("show_activity_log", True):
            self.log_frame.grid()
        else:
            self.log_frame.grid_remove()

    def start_module(self, name, module_file):
        """Start a specific optimization module"""
        if (not self.auto_mode and not self.manual_run_var.get() and
                not self.is_within_work_hours()):
            return

        if self.manual_paused:
            return

        if name in self.processes and self.processes[name].poll() is None:
            return

        try:
            # Start the process
            self.processes[name] = subprocess.Popen(
                [sys.executable, module_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )

            self.status_vars[name].set('RUNNING')
            self.log_event(f"{name.capitalize()} module started")

        except Exception as e:
            if self.settings.get("debug_mode", False):
                self.show_notification(f"Failed to start {name} module: {e}", "error")

    def stop_module(self, name):
        """Stop a specific optimization module"""
        if name in self.processes and self.processes[name].poll() is None:
            try:
                self.processes[name].terminate()
                self.processes[name].wait(timeout=5)
                self.status_vars[name].set('STOPPED')
                self.log_event(f"{name.capitalize()} module stopped")
            except subprocess.TimeoutExpired:
                self.processes[name].kill()
                self.status_vars[name].set('STOPPED')
                self.log_event(f"{name.capitalize()} module force stopped")
            except Exception as e:
                if self.settings.get("debug_mode", False):
                    self.show_notification(f"Error stopping {name} module: {e}", "error")
   
    def start_all_modules(self):
        """Start all optimization modules"""
        self.start_module('mouse', self.cursor_module)
        self.start_module('key', self.input_module)
   
    def pause_all_modules(self):
        """Pause all optimization modules (manual pause)"""
        self.manual_paused = True
        for name in list(self.processes.keys()):
            self.stop_module(name)
        self.update_status("Paused")
   
    def stop_all_modules(self):
        """Stop all optimization modules"""
        self.manual_paused = False
        for name in list(self.processes.keys()):
            self.stop_module(name)
        self.update_status("Stopped")
   
    def toggle_auto_mode(self):
        """Toggle between auto and manual mode"""
        self.auto_mode = self.auto_mode_var.get()
        if self.auto_mode:
            self.manual_paused = False
            self.update_status("Auto on")
        else:
            self.update_status("Manual")

    def toggle_manual_run(self):
        """Enable or disable manual always-on mode"""
        if self.manual_run_var.get():
            self.manual_paused = False
            self.update_status("Manual run enabled")
        else:
            self.update_status("Manual run disabled")
   
    def auto_manage_scripts(self):
        """Automatically manage optimization modules"""
        self.root.after(500, self.auto_manage_scripts)

        now = self.get_local_now()
        self.clock_var.set(now.strftime('%I:%M:%S %p'))

        running = any(proc.poll() is None for proc in self.processes.values())
        idle_time = time.time() - self.last_user_activity
        within_hours = self.is_within_work_hours(now)
        in_grace = self.is_within_grace_period(now)

        if idle_time > 30:
            self.activity_counter = 0

        if self.manual_paused:
            if running:
                for name in list(self.processes.keys()):
                    self.stop_module(name)
            self.update_status("Paused")
            return

        if self.manual_run_var.get():
            if not running:
                self.start_all_modules()
            self.update_status("Manual run active")
            return

        if not self.auto_mode:
            self.update_status("Manual control")
            return

        if within_hours:
            if self.grace_schedule_date != now.date():
                self.grace_stop_time = None
                self.grace_stop_triggered = False
                self.grace_schedule_date = now.date()

            idle_threshold = self.settings.get("idle_timeout", 3)
            auto_resume_delay = self.settings.get("auto_resume_delay", 8)

            if idle_time < idle_threshold or self.activity_counter > 5:
                if running and not self.user_active:
                    for name in list(self.processes.keys()):
                        self.stop_module(name)
                self.user_active = True
                self.update_status("User active")
            elif idle_time >= auto_resume_delay:
                self.user_active = False
                if not running:
                    self.start_all_modules()
                    self.update_status("Auto-resumed")
                else:
                    self.update_status("Active")
            else:
                remaining = int(max(auto_resume_delay - idle_time, 0))
                self.update_status(f"Resuming in {remaining}s")
            return

        if in_grace:
            if self.grace_schedule_date != now.date():
                self.grace_stop_time = None
                self.grace_stop_triggered = False
                self.grace_schedule_date = now.date()

            if self.grace_stop_time is None:
                _, end = self.get_work_schedule(now)
                offset = random.randint(0, 15 * 60)
                self.grace_stop_time = end + timedelta(seconds=offset)
                self.log_event(
                    f"Grace stop scheduled for {self.grace_stop_time.strftime('%I:%M:%S %p')}"
                )

            if (not self.grace_stop_triggered and self.grace_stop_time and
                    now >= self.grace_stop_time):
                if running:
                    for name in list(self.processes.keys()):
                        self.stop_module(name)
                self.grace_stop_triggered = True
                self.update_status("Grace stop executed")
            else:
                self.update_status("Grace period")
            return

        if running:
            for name in list(self.processes.keys()):
                self.stop_module(name)
        self.update_status("Off hours")
        self.user_active = False
        if self.grace_schedule_date != now.date():
            self.grace_stop_time = None
            self.grace_stop_triggered = False
   
    def show_settings(self):
        """Show settings dialog"""
        settings_win = tk.Toplevel(self.root)
        settings_win.title("System Preferences")
        settings_win.geometry("450x550")
        settings_win.resizable(False, False)
       
        notebook = ttk.Notebook(settings_win)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
       
        # Work Hours Tab
        hours_frame = ttk.Frame(notebook)
        notebook.add(hours_frame, text="Work Hours")
       
        ttk.Label(hours_frame, text="Start Time:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        start_hour = tk.IntVar(value=self.settings["work_start_hour"])
        start_minute = tk.IntVar(value=self.settings["work_start_minute"])
       
        ttk.Spinbox(hours_frame, from_=0, to=23, textvariable=start_hour, width=5).grid(row=0, column=1, padx=5)
        ttk.Label(hours_frame, text=":").grid(row=0, column=2)
        ttk.Spinbox(hours_frame, from_=0, to=59, textvariable=start_minute, width=5).grid(row=0, column=3, padx=5)
       
        ttk.Label(hours_frame, text="End Time:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        end_hour = tk.IntVar(value=self.settings["work_end_hour"])
        end_minute = tk.IntVar(value=self.settings["work_end_minute"])

        ttk.Spinbox(hours_frame, from_=0, to=23, textvariable=end_hour, width=5).grid(row=1, column=1, padx=5)
        ttk.Label(hours_frame, text=":").grid(row=1, column=2)
        ttk.Spinbox(hours_frame, from_=0, to=59, textvariable=end_minute, width=5).grid(row=1, column=3, padx=5)

        ttk.Label(hours_frame, text="Timezone:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=5)
        timezone_var = tk.StringVar(value=self.settings.get("timezone", "US/Eastern"))
        timezone_combo = ttk.Combobox(hours_frame, textvariable=timezone_var,
                                      values=pytz.common_timezones, width=30)
        timezone_combo.grid(row=2, column=1, columnspan=3, padx=5, pady=5, sticky="ew")

        timezone_status = tk.StringVar()

        def update_timezone_preview(*_):
            tz_name = timezone_var.get().strip()
            try:
                tz = pytz.timezone(tz_name)
            except Exception:
                timezone_status.set("Invalid timezone selected")
                return

            now = datetime.now(tz)
            start_dt = now.replace(
                hour=start_hour.get(),
                minute=start_minute.get(),
                second=0,
                microsecond=0,
            )
            end_dt = now.replace(
                hour=end_hour.get(),
                minute=end_minute.get(),
                second=0,
                microsecond=0,
            )
            if end_dt <= start_dt:
                end_dt += timedelta(days=1)

            within = start_dt <= now <= end_dt
            status = now.strftime("Current time: %I:%M %p")
            if within:
                status += " (within working hours)"
            else:
                status += " (outside working hours)"
            timezone_status.set(status)

        for var in (start_hour, start_minute, end_hour, end_minute):
            var.trace_add("write", update_timezone_preview)
        timezone_var.trace_add("write", update_timezone_preview)
        update_timezone_preview()

        ttk.Label(hours_frame, textvariable=timezone_status, wraplength=360,
                  foreground="navy").grid(row=3, column=0, columnspan=4, padx=5, pady=(0, 5), sticky=tk.W)

        # Behavior Tab
        behavior_frame = ttk.Frame(notebook)
        notebook.add(behavior_frame, text="Behavior")

        ttk.Label(behavior_frame, text="Idle Timeout (seconds):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        idle_timeout = tk.IntVar(value=self.settings["idle_timeout"])
        ttk.Spinbox(behavior_frame, from_=2, to=30, textvariable=idle_timeout, width=10).grid(row=0, column=1, padx=5, pady=5)
       
        ttk.Label(behavior_frame, text="Auto-resume delay (seconds):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        resume_delay = tk.IntVar(value=self.settings.get("auto_resume_delay", 10))
        ttk.Spinbox(behavior_frame, from_=5, to=60, textvariable=resume_delay, width=10).grid(row=1, column=1, padx=5, pady=5)
       
        auto_start = tk.BooleanVar(value=self.settings["auto_start"])
        ttk.Checkbutton(behavior_frame, text="Auto-start during work hours",
                       variable=auto_start).grid(row=2, column=0, columnspan=2, sticky=tk.W, padx=5, pady=5)
       
        always_on = tk.BooleanVar(value=self.settings.get("always_on_during_hours", True))
        ttk.Checkbutton(behavior_frame, text="Always active during business hours",
                       variable=always_on).grid(row=3, column=0, columnspan=2, sticky=tk.W, padx=5, pady=5)
       
        aggressive_detection = tk.BooleanVar(value=self.settings.get("aggressive_detection", True))
        ttk.Checkbutton(behavior_frame, text="Enhanced activity detection",
                       variable=aggressive_detection).grid(row=4, column=0, columnspan=2, sticky=tk.W, padx=5, pady=5)
       
        stealth_mode = tk.BooleanVar(value=self.settings.get("stealth_mode", True))
        ttk.Checkbutton(behavior_frame, text="Stealth mode (auto-minimize)",
                       variable=stealth_mode).grid(row=5, column=0, columnspan=2, sticky=tk.W, padx=5, pady=5)
       
        notifications = tk.BooleanVar(value=self.settings["notifications"])
        ttk.Checkbutton(behavior_frame, text="Show notifications",
                       variable=notifications).grid(row=6, column=0, columnspan=2, sticky=tk.W, padx=5, pady=5)

        debug_mode = tk.BooleanVar(value=self.settings.get("debug_mode", False))
        ttk.Checkbutton(behavior_frame, text="Debug mode (show output)",
                       variable=debug_mode).grid(row=7, column=0, columnspan=2, sticky=tk.W, padx=5, pady=5)

        show_log = tk.BooleanVar(value=self.settings.get("show_activity_log", True))
        ttk.Checkbutton(behavior_frame, text="Show activity log",
                       variable=show_log).grid(row=8, column=0, columnspan=2, sticky=tk.W, padx=5, pady=5)

        def save_settings():
            tz_name = timezone_var.get().strip()
            try:
                pytz.timezone(tz_name)
            except Exception:
                messagebox.showerror("Invalid Timezone", "Please select a valid timezone before saving.")
                return

            start_total = start_hour.get() * 60 + start_minute.get()
            end_total = end_hour.get() * 60 + end_minute.get()

            if start_total == end_total:
                messagebox.showerror("Invalid Schedule", "Start and end times must be different.")
                return

            if start_total > end_total:
                messagebox.showerror("Invalid Schedule", "End time must be later than start time.")
                return

            self.settings.update({
                "work_start_hour": start_hour.get(),
                "work_start_minute": start_minute.get(),
                "work_end_hour": end_hour.get(),
                "work_end_minute": end_minute.get(),
                "idle_timeout": idle_timeout.get(),
                "auto_resume_delay": resume_delay.get(),
                "auto_start": auto_start.get(),
                "always_on_during_hours": always_on.get(),
                "aggressive_detection": aggressive_detection.get(),
                "stealth_mode": stealth_mode.get(),
                "notifications": notifications.get(),
                "debug_mode": debug_mode.get(),
                "timezone": tz_name,
                "show_activity_log": show_log.get()
            })
            self.save_settings()
            settings_win.destroy()
            self.apply_log_visibility()
            if notifications.get():
                self.show_notification("Settings saved successfully")
       
        # Buttons
        button_frame = ttk.Frame(settings_win)
        button_frame.pack(fill=tk.X, padx=10, pady=5)
       
        ttk.Button(button_frame, text="Save", command=save_settings).pack(side=tk.RIGHT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=settings_win.destroy).pack(side=tk.RIGHT)
   
    def show_about(self):
        """Show about dialog"""
        about_text = """System Performance Monitor v2.0 - All-in-One

A professional productivity tool for optimizing system performance
and maintaining optimal responsiveness during work hours.

Enhanced Features:
• Always-on during business hours
• Smart activity detection & auto-pause
• Enhanced user activity monitoring  
• Automatic resume after inactivity
• Robust process management
• All-in-one single file deployment

Designed for seamless, discreet productivity optimization.
"""
        messagebox.showinfo("About", about_text)
   
    def cleanup_temp_files(self):
        """Clean up temporary module files"""
        try:
            if hasattr(self, 'cursor_module') and os.path.exists(self.cursor_module):
                os.unlink(self.cursor_module)
            if hasattr(self, 'input_module') and os.path.exists(self.input_module):
                os.unlink(self.input_module)
        except:
            pass
   
    def on_close(self):
        """Handle application closing"""
        # Stop all modules
        for name in list(self.processes.keys()):
            self.stop_module(name)
       
        # Save settings
        self.save_settings()
       
        # Clean up temporary files
        self.cleanup_temp_files()
       
        # Destroy the application
        self.root.destroy()
   
    def run(self):
        """Start the application"""
        # Set up window close protocol
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
       
        # Start the main loop
        self.root.mainloop()

# Main execution
if __name__ == "__main__":
    try:
        # Check Python version
        if sys.version_info < (3, 6):
            print("Python 3.6 or higher is required")
            sys.exit(1)
       
        # Check for required modules
        try:
            import pytz
        except ImportError:
            print("Missing required module: pytz")
            print("Install with: pip install pytz")
            sys.exit(1)
       
        # Create and run the application
        app = SystemPerformanceMonitor()
        app.run()
       
    except Exception as e:
        print(f"Critical error: {e}")
        try:
            messagebox.showerror("Critical Error", f"Application failed to start: {e}")
        except:
            pass
        sys.exit(1)

