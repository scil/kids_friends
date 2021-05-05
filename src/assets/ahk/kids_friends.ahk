#SingleInstance Ignore


 TargetScriptTitle := "Hello ahk_exe electron.exe"

GroupAdd, ExplorerWindows, ahk_class Progman ;Desktop 
GroupAdd, ExplorerWindows, ahk_class CabinetWClass ;Explorer Window 
GroupAdd, ExplorerWindows, ahk_class ExploreWClass ;Other Explorer Window 

; 为了识别双击 相关知识：
; How to assign action for Double Click? https://www.autohotkey.com/boards/viewtopic.php?t=64149
; 这个帖子未细看：Easiest way to detect double clicks? https://autohotkey.com/board/topic/56493-easiest-way-to-detect-double-clicks/ 
DblClickTime := DllCall("GetDoubleClickTime", "UInt")
;MsgBox, DblClickTime = %DblClickTime% ms


; 用剪切板方式获取鼠标点击的文件的名字 缺点是 
;       双击Explorer.exe 的非文件列表区域 只要有文件处于选中状态 就会返回这个文件的名字 
GetFilePath() {
        ClipSave:=ClipboardAll
        Clipboard:=""

        Send ^c
        ClipWait, .2
        Path=%clipboard%

        Clipboard:=ClipSave
        Return Path
}


Return ;end of Auto Execute



#IfWinActive, ahk_group ExplorerWindows

; why $? 
; 其实：The $ prefix has no effect for mouse hotkeys, since they always use the mouse hook. 
; https://www.autohotkey.com/docs/Hotkeys.htm#prefixdollar
$LButton::

        ; 单击
        ; 网上多是用 LButton，这里改用 Click，原因：LButton and RButton correspond to the "physical" left and right buttons when used with Send, but the "logical" left and right buttons when used with hotkeys. In other words, if the user has swapped the buttons via system settings, {LButton} performs a logical right click, but a physical left click activates the RButton:: hotkey. Likewise for {RButton} and LButton::. To always perform a logical click, use {Click} instead.
        ; Send {LButton Down}
        ; KeyWait LButton
        ; Send {LButton Up}
        If ( A_PriorHotkey != A_ThisHotkey or  A_TimeSincePriorHotkey > DblClickTime  )
         {
                 Send {Click} 
                 Return
         }

        v_FilePath:=GetFilePath()

        SplitPath, v_FilePath,,,v_Ext

        If (v_Ext="mp4") {

                 MsgBox % "You Double clicked on a mp4 file " . v_FilePath
                 F_Node_Write("file clicked", v_FilePath)  
        }
        Else
        {
                ; 非目标文件，则促成正常的双击
                ; 网上多是用 LButton，这里改用 Click，原因：同上
                 Send {Click} ;second Click of Double
        }

        Return



F_Node_Write(event, StringToSend) {
        ; 兼容node-ahk@1.0.7, scil版本已经加上了这句
        FileEncoding, UTF-8-RAW 
        ; Dynamically Calling a Function。这样不在node-ahk的环境下 也不会出错。经过测试，目前ahk不能用 if IsFunc("Node_Write"))  来判断函数存在性并运行函数   
        fn:= "Node_Write"
        %fn%(event, StringToSend)  
        
        global TargetScriptTitle
        result := Send_WM_COPYDATA(StringToSend, TargetScriptTitle)
        if (result = "FAIL")
            MsgBox SendMessage failed. Does the following WinTitle exist?:`n%TargetScriptTitle%
        else if (result = 0)
            MsgBox Message sent but the target window responded with 0, which may mean it ignored it.
        return

}




; from https://www.autohotkey.com/docs/commands/OnMessage.htm#SendString
Send_WM_COPYDATA(ByRef StringToSend, ByRef TargetScriptTitle)  ; ByRef saves a little memory in this case. 
; This function sends the specified string to the specified window and returns the reply. 
; The reply is 1 if the target window processed the message, or 0 if it ignored it. 
{
    VarSetCapacity(CopyDataStruct, 3*A_PtrSize, 0)  
    ; First set the structure's cbData member to the size of the string, including its zero terminator: 
    SizeInBytes := (StrLen(StringToSend) + 1) * (A_IsUnicode ? 2 : 1) 
    NumPut(SizeInBytes, CopyDataStruct, A_PtrSize)  
    NumPut(&StringToSend, CopyDataStruct, 2*A_PtrSize)  
    Prev_DetectHiddenWindows := A_DetectHiddenWindows
    Prev_TitleMatchMode := A_TitleMatchMode
    DetectHiddenWindows On
    SetTitleMatchMode 2
    TimeOutTime := 4000  
    ; Must use SendMessage not PostMessage. 
    SendMessage, 0x4a, 0, &CopyDataStruct,, %TargetScriptTitle%,,,, %TimeOutTime% 
    DetectHiddenWindows %Prev_DetectHiddenWindows% 
    SetTitleMatchMode %Prev_TitleMatchMode% 
    return ErrorLevel  
}