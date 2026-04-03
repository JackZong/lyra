// Lyra — Rust 后端入口
// 提供文件读写等系统级功能

use std::fs;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

/// 读取文本文件内容
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e))
}

/// 写入文本文件
#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| format!("保存文件失败: {}", e))
}

/// 检查文件是否存在
#[tauri::command]
fn file_exists(path: String) -> bool {
    std::path::Path::new(&path).exists()
}
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

/// 读取目录内容
#[tauri::command]
fn read_directory(path: String) -> Result<Vec<FileNode>, String> {
    let mut files = Vec::new();
    let entries = fs::read_dir(&path).map_err(|e| format!("无法读取目录: {}", e))?;

    for entry in entries {
        if let Ok(entry) = entry {
            let path_buf = entry.path();
            let name = match entry.file_name().into_string() {
                Ok(n) => n,
                Err(_) => continue,
            };
            
            // 忽略隐藏文件
            if name.starts_with('.') {
                continue;
            }

            let is_dir = path_buf.is_dir();

            // 如果是文件，仅保留 markdown 或 txt
            if !is_dir {
                if let Some(ext) = path_buf.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if ext_str != "md" && ext_str != "markdown" && ext_str != "txt" {
                        continue;
                    }
                } else {
                    continue; // 忽略无后缀文件
                }
            }

            files.push(FileNode {
                name,
                path: path_buf.to_string_lossy().to_string(),
                is_dir,
            });
        }
    }

    // 排序：文件夹在前，文件在后，按字母顺序
    files.sort_by(|a, b| {
        b.is_dir.cmp(&a.is_dir).then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(files)
}

/// 创建空白文件
#[tauri::command]
fn create_file(path: String) -> Result<(), String> {
    if std::path::Path::new(&path).exists() {
        return Err("文件已存在".into());
    }
    fs::write(&path, "").map_err(|e| format!("创建文件失败: {}", e))
}

/// 创建文件夹
#[tauri::command]
fn create_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("创建文件夹失败: {}", e))
}

/// 删除节点（文件或文件夹）
#[tauri::command]
fn delete_node(path: String) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    if !p.exists() {
        return Err("无此文件或目录".into());
    }
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| format!("删除文件夹失败: {}", e))
    } else {
        fs::remove_file(p).map_err(|e| format!("删除文件失败: {}", e))
    }
}

/// 重命名节点
#[tauri::command]
fn rename_node(old_path: String, new_path: String) -> Result<(), String> {
    if std::path::Path::new(&new_path).exists() {
        return Err("目标路径已存在文件，无法重命名".into());
    }
    fs::rename(old_path, new_path).map_err(|e| format!("重命名失败: {}", e))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub file_path: String,
    pub file_name: String,
    pub line_number: usize,
    pub snippet: String,
}

#[tauri::command]
fn search_in_workspace(path: String, query: String) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();
    let mut dirs_to_visit = vec![std::path::PathBuf::from(path)];
    let query_lower = query.to_lowercase();
    let max_results = 50;

    'outer: while let Some(dir) = dirs_to_visit.pop() {
        if let Ok(entries) = fs::read_dir(&dir) {
            for entry in entries.filter_map(Result::ok) {
                let path_buf = entry.path();
                let name = entry.file_name().to_string_lossy().to_string();
                
                // 忽略隐藏文件、Git、或者 Node 构建文件
                if name.starts_with('.') || name == "node_modules" || name == "target" || name == ".git" {
                    continue;
                }
                
                if path_buf.is_dir() {
                    dirs_to_visit.push(path_buf);
                } else {
                    if let Some(ext) = path_buf.extension() {
                        let ext_str = ext.to_string_lossy().to_lowercase();
                        if ext_str == "md" || ext_str == "markdown" || ext_str == "txt" {
                            if let Ok(content) = fs::read_to_string(&path_buf) {
                                for (i, line) in content.lines().enumerate() {
                                    if line.to_lowercase().contains(&query_lower) {
                                        let snippet = line.trim().chars().take(120).collect::<String>();
                                        results.push(SearchResult {
                                            file_path: path_buf.to_string_lossy().to_string(),
                                            file_name: name.clone(),
                                            line_number: i + 1,
                                            snippet,
                                        });
                                        if results.len() >= max_results {
                                            break 'outer;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(results)
}

struct PendingFiles(Mutex<Vec<String>>);

/// 前端启动后调用，取走缓存的待打开文件路径
#[tauri::command]
fn take_pending_files(state: tauri::State<PendingFiles>) -> Vec<String> {
    let mut pending = state.0.lock().unwrap();
    pending.drain(..).collect()
}

fn collect_file_paths_from_args() -> Vec<String> {
    std::env::args()
        .skip(1)
        .filter(|arg| !arg.starts_with('-'))
        .filter(|arg| {
            let p = std::path::Path::new(arg);
            match p.extension().and_then(|e| e.to_str()) {
                Some(ext) => matches!(ext, "md" | "markdown" | "mdown" | "mkd" | "mdx" | "txt"),
                None => false,
            }
        })
        .filter(|arg| std::path::Path::new(arg).exists())
        .collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let cli_files = collect_file_paths_from_args();

    tauri::Builder::default()
        .manage(PendingFiles(Mutex::new(cli_files)))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            use tauri::menu::*;

            // 首选项菜单项
            let preferences = MenuItemBuilder::new("首选项...")
                .id("preferences")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;

            // 应用子菜单（macOS 第一个子菜单即为应用菜单）
            let app_submenu = SubmenuBuilder::new(app, "Lyra")
                .about(Some(AboutMetadata::default()))
                .separator()
                .item(&preferences)
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?;

            // File 菜单
            let file_submenu = SubmenuBuilder::new(app, "File")
                .close_window()
                .build()?;

            // Edit 菜单
            let edit_submenu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            // View 菜单
            let view_submenu = SubmenuBuilder::new(app, "View")
                .build()?;

            // Window 菜单
            let window_submenu = SubmenuBuilder::new(app, "Window")
                .minimize()
                .build()?;

            // Help 菜单
            let help_submenu = SubmenuBuilder::new(app, "Help")
                .build()?;

            let menu = MenuBuilder::new(app)
                .items(&[
                    &app_submenu,
                    &file_submenu,
                    &edit_submenu,
                    &view_submenu,
                    &window_submenu,
                    &help_submenu,
                ])
                .build()?;

            app.set_menu(menu)?;

            // 监听菜单事件
            app.on_menu_event(|app_handle, event| {
                if event.id() == "preferences" {
                    let _ = app_handle.emit("open-settings", ());
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            file_exists,
            read_directory,
            create_file,
            create_dir,
            delete_node,
            rename_node,
            search_in_workspace,
            take_pending_files,
        ])
        .build(tauri::generate_context!())
        .expect("启动 Lyra 时发生错误")
        .run(|_app, _event| {
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            if let tauri::RunEvent::Opened { urls } = &_event {
                for url in urls {
                    if let Ok(path) = url.to_file_path() {
                        if let Some(path_str) = path.to_str() {
                            let path_string = path_str.to_string();
                            let _ = _app.emit("open-file", path_string.clone());
                            if let Some(state) = _app.try_state::<PendingFiles>() {
                                state.0.lock().unwrap().push(path_string);
                            }
                        }
                    }
                }
            }
        });
}
