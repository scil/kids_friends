#SingleInstance Force
DetectHiddenWindows 1

; 尝试过不用 ahk_exe， 因为
;     测试时是 ahk_exe electron.exe
;     打包后是  ahk_exe Kids.exe
; 但尝试失败：用 ahk_class，或只用 title，但都不工作
; TargetScriptTitle := "Hello ahk_class Chrome_WidgetWin_1 "
global TargetScriptTitle := "Hello ahk_exe electron.exe"

; 等待窗口出现
if WinWait(TargetScriptTitle, , 3)
{
       WinHide
}
 

GroupAdd "ExplorerWindows", "ahk_class Progman" ;Desktop
GroupAdd "ExplorerWindows", "ahk_class CabinetWClass" ;Explorer Window
GroupAdd "ExplorerWindows", "ahk_class ExploreWClass" ;Other Explorer Window

; 为了识别双击 相关知识：
; How to assign action for Double Click? https://www.autohotkey.com/boards/viewtopic.php?t=64149
; 这个帖子未细看：Easiest way to detect double clicks? https://autohotkey.com/board/topic/56493-easiest-way-to-detect-double-clicks/
DblClickTime := DllCall("GetDoubleClickTime", "UInt")
;MsgBox, DblClickTime = %DblClickTime% ms





HotIfWinActive "ahk_group ExplorerWindows"
; why $?
; 其实：The $ prefix has no effect for mouse hotkeys, since they always use the mouse hook.
; https://www.autohotkey.com/docs/Hotkeys.htm#prefixdollar
Hotkey "$LButton", "MyFuncLButton"


MyFuncLButton(ThisHotkey){
        global DblClickTime

        ; 单击
        ; 网上多是用 LButton，这里改用 Click，原因：LButton and RButton correspond to the "physical" left and right buttons when used with Send, but the "logical" left and right buttons when used with hotkeys. In other words, if the user has swapped the buttons via system settings, {LButton} performs a logical right click, but a physical left click activates the RButton:: hotkey. Likewise for {RButton} and LButton::. To always perform a logical click, use {Click} instead.
        ; Send {LButton Down}
        ; KeyWait LButton
        ; Send {LButton Up}
        If ( A_PriorHotkey != A_ThisHotkey or  A_TimeSincePriorHotkey > DblClickTime  )
         {
                 Send "{Click}"
                 Return
         }

        v_FilePath:=GetFilePath()

        SplitPath  v_FilePath,,,v_Ext

        If (v_Ext=="mp4" or v_Ext=="mkv" or v_Ext=="rmvb") {

                 ;MsgBox % "You Double clicked on a mp4 file " . v_FilePath
                 MyFunc_To_Run_File("file clicked", v_FilePath)
        }
        Else
        {
                ; 非目标文件，则促成正常的双击
                ; 网上多是用 LButton，这里改用 Click，原因：同上
                 Send "{Click}" ;second Click of Double
        }

}

; 用剪切板方式获取鼠标点击的文件的名字 缺点是
;       双击Explorer.exe 的非文件列表区域 只要有文件处于选中状态 就会返回这个文件的名字
;       拖动失灵
GetFilePath() {
        ClipSaved := ClipboardAll() 
        A_Clipboard := ""

        Send "^c"
        ClipWait
        Path:= A_Clipboard

        A_Clipboard := ClipSaved   
        ClipSaved := "" 
        return   Path
}



; 没有象ahk示范代码那样 用变量result 因为
; 不象ahk的OnMessage， electron 里的hookWindowMessage回调函数，运行后没有返回值
; https://github.com/electron/electron/blob/11199d8824612e3d434ea2a8af2a9a608a522903/shell/browser/api/electron_api_base_window.cc#L307
; 以下来自ahk示范代码
;         if (result = "FAIL")
;             MsgBox SendMessage failed. Does the following WinTitle exist?:`n%TargetScriptTitle%
;         else if (result = 0)
;             MsgBox Message sent but the target window responded with 0, which may mean it ignored it.
MyFunc_To_Run_File(event, StringToSend) {
        global TargetScriptTitle
        if not WinExist(TargetScriptTitle)
        {
            msgbox "will to send string " . StringToSend
            return
        }
        else
        {
                WinShow TargetScriptTitle
                WinMaximize  TargetScriptTitle
                WinActivate TargetScriptTitle
                WinSetAlwaysOnTop  1, TargetScriptTitle
                result := Send_WM_COPYDATA(StringToSend, TargetScriptTitle)
                return
        }
}




; copy from https://lexikos.github.io/v2/docs/commands/OnMessage.htm
Send_WM_COPYDATA(ByRef StringToSend, ByRef TargetScriptTitle)  ; ByRef saves a little memory in this case.
; This function sends the specified string to the specified window and returns the reply.
; The reply is 1 if the target window processed the message, or 0 if it ignored it.
{
    CopyDataStruct := BufferAlloc(3*A_PtrSize)  ; Set up the structure's memory area.
    ; First set the structure's cbData member to the size of the string, including its zero terminator:
    SizeInBytes := (StrLen(StringToSend) + 1) * 2
    NumPut( "Ptr", SizeInBytes  ; OS requires that this be done.
          , "Ptr", StrPtr(StringToSend)  ; Set lpData to point to the string itself.
          , CopyDataStruct, A_PtrSize)
    Prev_DetectHiddenWindows := A_DetectHiddenWindows
    Prev_TitleMatchMode := A_TitleMatchMode
    DetectHiddenWindows True
    SetTitleMatchMode 2
    TimeOutTime := 4000  ; Optional. Milliseconds to wait for response from receiver.ahk. Default is 5000
    ; Must use SendMessage not PostMessage.
    RetValue := SendMessage(0x4a, 0, CopyDataStruct,, TargetScriptTitle,,,, TimeOutTime) ; 0x4a is WM_COPYDATA.
    DetectHiddenWindows Prev_DetectHiddenWindows  ; Restore original setting for the caller.
    SetTitleMatchMode Prev_TitleMatchMode         ; Same.
    return RetValue  ; Return SendMessage's reply back to our caller.
}