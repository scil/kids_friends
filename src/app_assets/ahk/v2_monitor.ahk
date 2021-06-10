#SingleInstance Force
DetectHiddenWindows 1

global TargetScriptTitle := "Hello ahk_exe electron.exe"

if WinWait(TargetScriptTitle, , 3)
{
       WinHide
}
 

GroupAdd "ExplorerWindows", "ahk_class Progman" ;Desktop
GroupAdd "ExplorerWindows", "ahk_class CabinetWClass" ;Explorer Window
GroupAdd "ExplorerWindows", "ahk_class ExploreWClass" ;Other Explorer Window

DblClickTime := DllCall("GetDoubleClickTime", "UInt")

HotIfWinActive "ahk_group ExplorerWindows"
Hotkey "$LButton", "MyFuncLButton"


MyFuncLButton(ThisHotkey){
        global DblClickTime

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
                 Send "{Click}" ;second Click of Double
        }

}

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




Send_WM_COPYDATA(ByRef StringToSend, ByRef TargetScriptTitle)  
{
    CopyDataStruct := BufferAlloc(3*A_PtrSize)  
    SizeInBytes := (StrLen(StringToSend) + 1) * 2
    NumPut( "Ptr", SizeInBytes  
          , "Ptr", StrPtr(StringToSend)  
          , CopyDataStruct, A_PtrSize)
    Prev_DetectHiddenWindows := A_DetectHiddenWindows
    Prev_TitleMatchMode := A_TitleMatchMode
    DetectHiddenWindows True
    SetTitleMatchMode 2
    TimeOutTime := 4000  
    
    RetValue := SendMessage(0x4a, 0, CopyDataStruct,, TargetScriptTitle,,,, TimeOutTime) 
    DetectHiddenWindows Prev_DetectHiddenWindows  
    SetTitleMatchMode Prev_TitleMatchMode         
    return RetValue  
}